import { createHash } from "node:crypto";
import { access, mkdir, readdir, readFile, readlink, rename, rm, stat, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  applyChanges,
  CONTRACT_VERSION,
  isCollectionName,
  PatchError,
  validateContent,
  type ChangeOp,
  type CollectionName,
  type ContentIssue,
  type RawContent,
} from "@canopy/site-contract";
import { formatIssues, readContent, validateSite, writeContent } from "@canopy/site-contract/node";
import { git, gitEnv, resetTree, resolveRepo, syncClone, type RepoRef } from "./git.ts";
import { buildEnv, Log, run, StepError } from "./run.ts";

export const SITES_ROOT = process.env.SITES_ROOT ?? "/srv/sites";
const KEYS_DIR = process.env.KEYS_DIR ?? "/tmp/canopy-keys";
const KNOWN_HOSTS = path.join(SITES_ROOT, ".known_hosts");
const RETAIN = Number(process.env.BUILDS_RETAINED ?? 5);

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const BUILD_ID = /^[a-z0-9]{10,40}$/;

export interface SiteRef {
  slug: string;
  repoUrl: string;
  branch: string;
}

export type BuildStatus = "queued" | "running" | "succeeded" | "failed";

export interface BuildRecord {
  id: string;
  slug: string;
  status: BuildStatus;
  baseCommit?: string;
  error?: string;
  issues?: ContentIssue[];
  log: string;
  startedAt?: string;
  finishedAt?: string;
}

const dirs = (slug: string) => {
  const root = path.join(SITES_ROOT, slug);
  return {
    root,
    repo: path.join(root, "repo"),
    builds: path.join(root, "builds"),
    meta: path.join(root, "meta"),
    preview: path.join(root, "preview"),
    current: path.join(root, "current"),
    lockHash: path.join(root, "lockhash"),
  };
};

// ---------------------------------------------------------------------------
// One job at a time per site, at most two sites building at once.

const siteQueues = new Map<string, Promise<unknown>>();
let running = 0;
const waiting: Array<() => void> = [];
const MAX_CONCURRENT = 2;

async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT) await new Promise<void>((r) => waiting.push(r));
  running++;
  try {
    return await fn();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

export function enqueue<T>(slug: string, fn: () => Promise<T>): Promise<T> {
  const prev = siteQueues.get(slug) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(() => slot(fn));
  siteQueues.set(slug, next);
  return next;
}

// ---------------------------------------------------------------------------

async function prepare(site: SiteRef, log: Log): Promise<{ ref: RepoRef; env: Record<string, string>; head: string }> {
  if (!SLUG.test(site.slug) || site.slug.length > 40) throw new StepError(`"${site.slug}" is not a site slug`);
  const d = dirs(site.slug);
  await mkdir(d.builds, { recursive: true });
  await mkdir(d.meta, { recursive: true });
  const ref = await resolveRepo(site.slug, site.repoUrl, site.branch, KEYS_DIR);
  const env = gitEnv(ref, KNOWN_HOSTS);
  const head = await syncClone(d.repo, ref, env, log);
  return { ref, env, head };
}

/** Current content of the site's branch, straight from the repo. */
export async function readSiteContent(site: SiteRef): Promise<{ commit: string; content: RawContent; contractVersion: string | null }> {
  return enqueue(site.slug, async () => {
    const log = new Log();
    const { head } = await prepare(site, log);
    const { content, issues } = await readContent(dirs(site.slug).repo);
    if (issues.length) throw new StepError(formatIssues(issues));
    return { commit: head, content, contractVersion: await installedContractVersion(site.slug) };
  });
}

async function installedContractVersion(slug: string): Promise<string | null> {
  try {
    const lock = JSON.parse(await readFile(path.join(dirs(slug).repo, "package-lock.json"), "utf8"));
    return lock.packages?.["node_modules/@canopy/site-contract"]?.version ?? null;
  } catch {
    return null;
  }
}

/**
 * Applies ops to the working tree's content and checks the result. Only the
 * collections the ops touch are rewritten.
 */
async function applyOps(repoDir: string, ops: ChangeOp[]): Promise<CollectionName[]> {
  if (ops.length === 0) return [];
  const { content, issues } = await readContent(repoDir);
  if (issues.length) throw new ContentError(issues);
  let after: RawContent;
  try {
    after = applyChanges(content as Record<string, unknown>, ops) as RawContent;
  } catch (err) {
    if (err instanceof PatchError) throw new StepError(err.message);
    throw err;
  }
  const result = validateContent(after);
  if (!result.ok) throw new ContentError(result.issues);
  const touched = [...new Set(ops.map((o) => o.collection))].filter(isCollectionName);
  await writeContent(repoDir, after, touched);
  return touched;
}

export class ContentError extends StepError {
  issues: ContentIssue[];
  constructor(issues: ContentIssue[]) {
    super(`The change doesn't fit the site's content rules:\n${formatIssues(issues)}`);
    this.issues = issues;
  }
}

async function npmCiIfNeeded(slug: string, repoDir: string, log: Log) {
  const d = dirs(slug);
  const lock = await readFile(path.join(repoDir, "package-lock.json"));
  const hash = createHash("sha256").update(lock).digest("hex");
  const previous = await readFile(d.lockHash, "utf8").catch(() => "");
  const haveModules = await access(path.join(repoDir, "node_modules")).then(
    () => true,
    () => false,
  );
  if (previous === hash && haveModules) {
    log.add("Dependencies unchanged; skipping npm ci");
    return;
  }
  log.add("Installing dependencies (npm ci)");
  await run("npm", ["ci", "--no-audit", "--no-fund"], { cwd: repoDir, env: buildEnv(), log, timeoutMs: 600_000 });
  await writeFile(d.lockHash, hash);
}

async function pointAt(link: string, target: string) {
  const tmp = `${link}.tmp-${process.pid}-${Date.now()}`;
  await symlink(target, tmp);
  await rename(tmp, link);
}

async function linkTarget(link: string): Promise<string | null> {
  try {
    return path.basename(await readlink(link));
  } catch {
    return null;
  }
}

async function saveRecord(rec: BuildRecord) {
  await writeFile(path.join(dirs(rec.slug).meta, `${rec.id}.json`), JSON.stringify(rec, null, 2));
}

const records = new Map<string, BuildRecord>();

export async function getBuild(slug: string, id: string): Promise<BuildRecord | null> {
  const live = records.get(id);
  if (live && live.slug === slug) return live;
  try {
    return JSON.parse(await readFile(path.join(dirs(slug).meta, `${id}.json`), "utf8"));
  } catch {
    return null;
  }
}

/**
 * Queues a preview build: the branch's HEAD plus `ops`, validated, built, and
 * made the site's preview. Returns at once; poll getBuild for the outcome.
 * A failed build never moves `preview`.
 */
export function startPreview(site: SiteRef, id: string, ops: ChangeOp[], baseCommit?: string): BuildRecord {
  const rec: BuildRecord = { id, slug: site.slug, status: "queued", baseCommit, log: "" };
  records.set(id, rec);
  const log = new Log();
  enqueue(site.slug, async () => {
    rec.status = "running";
    rec.startedAt = new Date().toISOString();
    const d = dirs(site.slug);
    const started = Date.now();
    try {
      const { env, head } = await prepare(site, log);
      if (baseCommit && head !== baseCommit) {
        throw new StepError("The site changed since this change was proposed. Propose it again.");
      }
      rec.baseCommit = head;
      try {
        const touched = await applyOps(d.repo, ops);
        log.add(touched.length ? `Applied changes to ${touched.join(", ")}` : "No content changes");
        const check = await validateSite(d.repo);
        if (!check.ok) throw new ContentError(check.issues);
        await npmCiIfNeeded(site.slug, d.repo, log);
        log.add("Building (astro build)");
        await rm(path.join(d.repo, "dist"), { recursive: true, force: true });
        await run("npm", ["run", "build"], { cwd: d.repo, env: buildEnv(), log, timeoutMs: 300_000 });
        await rename(path.join(d.repo, "dist"), path.join(d.builds, id));
      } finally {
        await resetTree(d.repo, env).catch(() => undefined);
      }
      await pointAt(d.preview, path.join("builds", id));
      rec.status = "succeeded";
      log.add(`Preview ready in ${Math.round((Date.now() - started) / 1000)} s`);
      await prune(site.slug);
    } catch (err) {
      rec.status = "failed";
      rec.error = err instanceof StepError ? err.message : `Unexpected error: ${(err as Error).message}`;
      if (err instanceof ContentError) rec.issues = err.issues;
      log.add(rec.error);
    } finally {
      rec.finishedAt = new Date().toISOString();
      rec.log = log.toString();
      await saveRecord(rec).catch(() => undefined);
      records.delete(id);
    }
  }).catch(() => undefined);
  return rec;
}

/**
 * Publishes a previewed build: re-applies the same ops to the same base
 * commit, commits and pushes them, then points `current` at the build that
 * was previewed (no rebuild, so what was approved is what goes live). If the
 * branch moved since the preview, nothing happens and the change must be
 * previewed again.
 */
export function publish(
  site: SiteRef,
  buildId: string,
  ops: ChangeOp[],
  baseCommit: string,
  message: string,
  author: { name: string; email: string },
): Promise<{ commit: string | null; log: string }> {
  return enqueue(site.slug, async () => {
    const log = new Log();
    const d = dirs(site.slug);
    const built = await getBuild(site.slug, buildId);
    if (!built || built.status !== "succeeded") throw new StepError("That preview build didn't succeed, so there is nothing to publish.");
    await stat(path.join(d.builds, buildId)).catch(() => {
      throw new StepError("That preview build is no longer kept. Preview the change again.");
    });
    const { env, head } = await prepare(site, log);
    if (head !== baseCommit) throw new StepError("The site changed since this preview. Preview the change again.");
    let commit: string | null = null;
    try {
      const touched = await applyOps(d.repo, ops);
      if (touched.length) {
        await git(d.repo, env, ["add", "--", ...touched.map((c) => `src/content/${c}.json`)], log);
        const staged = await git(d.repo, env, ["diff", "--cached", "--name-only"]);
        if (staged.trim()) {
          await git(
            d.repo,
            env,
            ["-c", `user.name=${author.name}`, "-c", `user.email=${author.email}`, "commit", "-q", "-m", message],
            log,
          );
          await git(d.repo, env, ["push", "origin", `HEAD:refs/heads/${site.branch}`], log);
          commit = (await git(d.repo, env, ["rev-parse", "HEAD"])).trim();
        }
      }
    } catch (err) {
      await resetTree(d.repo, env).catch(() => undefined);
      throw err;
    }
    await pointAt(d.current, path.join("builds", buildId));
    log.add(commit ? `Published ${commit.slice(0, 7)}` : "Published with no content change");
    return { commit, log: log.toString() };
  });
}

/** Which builds the site's live and preview views point at. */
export async function siteStatus(slug: string) {
  const d = dirs(slug);
  return { current: await linkTarget(d.current), preview: await linkTarget(d.preview), contractVersion: CONTRACT_VERSION };
}

/** The directory a view serves from, or null if that view has no build yet. */
export async function viewRoot(slug: string, view: "current" | "preview"): Promise<string | null> {
  const d = dirs(slug);
  const target = await linkTarget(view === "current" ? d.current : d.preview);
  return target ? path.join(d.builds, target) : null;
}

/** Keeps the newest builds plus whatever current and preview point at. */
async function prune(slug: string) {
  const d = dirs(slug);
  const keep = new Set([await linkTarget(d.current), await linkTarget(d.preview)].filter(Boolean) as string[]);
  const entries = await readdir(d.builds);
  const dated = await Promise.all(entries.map(async (e) => ({ e, t: (await stat(path.join(d.builds, e))).mtimeMs })));
  dated.sort((a, b) => b.t - a.t);
  for (const { e } of dated.slice(RETAIN)) {
    if (!keep.has(e)) await rm(path.join(d.builds, e), { recursive: true, force: true });
  }
}
