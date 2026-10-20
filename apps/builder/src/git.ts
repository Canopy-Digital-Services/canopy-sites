import { access, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { Log, run, StepError } from "./run.ts";

const GITHUB_REPO = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/;
const BRANCH = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/;

export interface RepoRef {
  /** What git clones from: a GitHub remote, or a local path in development. */
  remote: string;
  branch: string;
  /** A repo-scoped GitHub token for this site. */
  token?: string;
}

/**
 * Turns the Site row's repo URL into a git remote. Only GitHub repos are
 * accepted in production; local paths only with BUILDER_ALLOW_LOCAL_REPOS=1
 * (development, against a bare repo on disk).
 */
export function resolveRepo(slug: string, repoUrl: string, branch: string): RepoRef {
  if (!BRANCH.test(branch) || branch.includes("..")) throw new StepError(`"${branch}" is not a branch name the builder accepts`);
  const gh = GITHUB_REPO.exec(repoUrl);
  if (gh) {
    // A fine-grained token limited to this repo (Contents: read and write).
    const envName = `GIT_TOKEN_${slug.toUpperCase().replace(/-/g, "_")}`;
    const token = process.env[envName];
    if (!token) throw new StepError(`No credentials for this site's repo (set ${envName} on the builder)`);
    return { remote: `https://github.com/${gh[1]}/${gh[2]}.git`, branch, token };
  }
  if (process.env.BUILDER_ALLOW_LOCAL_REPOS === "1" && path.isAbsolute(repoUrl) && !repoUrl.includes("..")) {
    return { remote: repoUrl, branch };
  }
  throw new StepError(`"${repoUrl}" is not a GitHub repository URL (https://github.com/owner/repo)`);
}

/**
 * A site's clone: git's own directory kept apart from the working tree, so
 * nothing written into the tree can change what git reads or runs. Every git
 * command names both, and no `.git` is left in the tree.
 */
export interface Clone {
  gitDir: string;
  workTree: string;
}

export function gitEnv(ref: RepoRef, clone?: Clone): Record<string, string> {
  const env: Record<string, string> = {
    PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
    HOME: process.env.HOME ?? "/tmp",
    GIT_TERMINAL_PROMPT: "0",
  };
  // Config through the environment: the token never appears in argv, in the
  // remote URL, in git's config file, or in a log line. Hooks and fsmonitor
  // are off. (Ownership checks are off in the image's system config.)
  const config: Array<[string, string]> = [
    ["core.hooksPath", "/dev/null"],
    ["core.fsmonitor", "false"],
  ];
  if (ref.token) {
    config.push(["http.https://github.com/.extraheader", `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${ref.token}`).toString("base64")}`]);
  }
  env.GIT_CONFIG_COUNT = String(config.length);
  config.forEach(([key, value], i) => {
    env[`GIT_CONFIG_KEY_${i}`] = key;
    env[`GIT_CONFIG_VALUE_${i}`] = value;
  });
  if (clone) {
    env.GIT_DIR = clone.gitDir;
    env.GIT_WORK_TREE = clone.workTree;
  }
  return env;
}

export function git(repoDir: string, env: Record<string, string>, args: string[], log?: Log) {
  return run("git", args, { cwd: repoDir, env, log, timeoutMs: 120_000 });
}

/**
 * Makes the working clone match the remote branch exactly, discarding any
 * leftover edits. Ignored files (node_modules) survive, which is what keeps
 * repeat builds fast.
 */
export async function syncClone(clone: Clone, ref: RepoRef, env: Record<string, string>, log: Log): Promise<string> {
  const parent = path.dirname(clone.workTree);
  await mkdir(parent, { recursive: true });
  const fresh = !(await access(path.join(clone.gitDir, "HEAD")).then(
    () => true,
    () => false,
  ));
  if (fresh) {
    // Also replaces a clone from before git's directory moved out of the tree.
    await rm(clone.workTree, { recursive: true, force: true });
    await rm(clone.gitDir, { recursive: true, force: true });
    const { GIT_DIR: _dir, GIT_WORK_TREE: _tree, ...cloneEnv } = env;
    await git(parent, cloneEnv, ["clone", "--separate-git-dir", clone.gitDir, "--branch", ref.branch, "--single-branch", ref.remote, clone.workTree], log);
    await rm(path.join(clone.workTree, ".git"), { force: true });
  } else {
    await git(clone.workTree, env, ["remote", "set-url", "origin", ref.remote]);
    await git(clone.workTree, env, ["fetch", "--prune", "origin", `+refs/heads/${ref.branch}:refs/remotes/origin/${ref.branch}`], log);
    await git(clone.workTree, env, ["checkout", "-q", "-B", ref.branch, `origin/${ref.branch}`], log);
    await git(clone.workTree, env, ["reset", "-q", "--hard", `origin/${ref.branch}`], log);
    await git(clone.workTree, env, ["clean", "-q", "-fd"], log);
  }
  return (await git(clone.workTree, env, ["rev-parse", "HEAD"])).trim();
}

/** Updates refs/remotes/origin/<branch> from the remote, leaving the working tree alone. */
export async function fetchBranch(repoDir: string, ref: RepoRef, env: Record<string, string>) {
  await git(repoDir, env, ["remote", "set-url", "origin", ref.remote]);
  await git(repoDir, env, ["fetch", "--prune", "origin", `+refs/heads/${ref.branch}:refs/remotes/origin/${ref.branch}`]);
}

/**
 * A file's text at a commit, or null when the commit has no such file. Reads
 * git's objects, never the working tree, so it is safe while a build edits it.
 */
export async function showFile(repoDir: string, env: Record<string, string>, commit: string, file: string): Promise<string | null> {
  const present = await git(repoDir, env, ["cat-file", "-e", `${commit}:${file}`]).then(
    () => true,
    () => false,
  );
  return present ? git(repoDir, env, ["show", `${commit}:${file}`]) : null;
}

/** Leaves the working tree exactly at HEAD again after a build's edits. */
export async function resetTree(repoDir: string, env: Record<string, string>) {
  await git(repoDir, env, ["reset", "-q", "--hard", "HEAD"]);
  await git(repoDir, env, ["clean", "-q", "-fd"]);
}
