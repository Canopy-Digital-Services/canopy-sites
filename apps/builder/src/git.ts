import { chmod, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Log, run, StepError } from "./run.ts";

const GITHUB_REPO = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/;
const BRANCH = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/;

export interface RepoRef {
  /** What git clones from: an SSH remote, or a local path in development. */
  remote: string;
  branch: string;
  /** Present for GitHub remotes: the deploy key file for this site. */
  keyFile?: string;
}

/**
 * Turns the Site row's repo URL into a git remote. Only GitHub repos are
 * accepted in production; local paths only with BUILDER_ALLOW_LOCAL_REPOS=1
 * (development, against a bare repo on disk).
 */
export async function resolveRepo(slug: string, repoUrl: string, branch: string, keysDir: string): Promise<RepoRef> {
  if (!BRANCH.test(branch) || branch.includes("..")) throw new StepError(`"${branch}" is not a branch name the builder accepts`);
  const gh = GITHUB_REPO.exec(repoUrl);
  if (gh) {
    const envName = `DEPLOY_KEY_${slug.toUpperCase().replace(/-/g, "_")}`;
    const key = process.env[envName];
    if (!key) throw new StepError(`No deploy key for this site (${envName} is not set on the builder)`);
    await mkdir(keysDir, { recursive: true, mode: 0o700 });
    const keyFile = path.join(keysDir, slug);
    const pem = key.includes("BEGIN") ? key : Buffer.from(key, "base64").toString("utf8");
    await writeFile(keyFile, pem.endsWith("\n") ? pem : pem + "\n", { mode: 0o600 });
    await chmod(keyFile, 0o600);
    return { remote: `git@github.com:${gh[1]}/${gh[2]}.git`, branch, keyFile };
  }
  if (process.env.BUILDER_ALLOW_LOCAL_REPOS === "1" && path.isAbsolute(repoUrl) && !repoUrl.includes("..")) {
    return { remote: repoUrl, branch };
  }
  throw new StepError(`"${repoUrl}" is not a GitHub repository URL (https://github.com/owner/repo)`);
}

export function gitEnv(ref: RepoRef, knownHosts: string): Record<string, string> {
  const env: Record<string, string> = {
    PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
    HOME: process.env.HOME ?? "/tmp",
    GIT_TERMINAL_PROMPT: "0",
  };
  if (ref.keyFile) {
    env.GIT_SSH_COMMAND = `ssh -i ${ref.keyFile} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=${knownHosts}`;
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
export async function syncClone(repoDir: string, ref: RepoRef, env: Record<string, string>, log: Log): Promise<string> {
  const parent = path.dirname(repoDir);
  await mkdir(parent, { recursive: true });
  const fresh = !(await git(parent, env, ["-C", repoDir, "rev-parse", "--git-dir"]).then(
    () => true,
    () => false,
  ));
  if (fresh) {
    await git(parent, env, ["clone", "--branch", ref.branch, "--single-branch", ref.remote, repoDir], log);
  } else {
    await git(repoDir, env, ["remote", "set-url", "origin", ref.remote]);
    await git(repoDir, env, ["fetch", "--prune", "origin", `+refs/heads/${ref.branch}:refs/remotes/origin/${ref.branch}`], log);
    await git(repoDir, env, ["checkout", "-q", "-B", ref.branch, `origin/${ref.branch}`], log);
    await git(repoDir, env, ["reset", "-q", "--hard", `origin/${ref.branch}`], log);
    await git(repoDir, env, ["clean", "-q", "-fd"], log);
  }
  return (await git(repoDir, env, ["rev-parse", "HEAD"])).trim();
}

/** Leaves the working tree exactly at HEAD again after a build's edits. */
export async function resetTree(repoDir: string, env: Record<string, string>) {
  await git(repoDir, env, ["reset", "-q", "--hard", "HEAD"]);
  await git(repoDir, env, ["clean", "-q", "-fd"]);
}
