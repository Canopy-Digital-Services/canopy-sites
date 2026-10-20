import { createHash, randomBytes } from "node:crypto";
import { access, mkdir, readdir, readFile, readlink, rename, rm, stat, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  applyChanges,
  collections,
  COLLECTION_NAMES,
  CONTRACT_VERSION,
  isCollectionName,
  opCollection,
  PatchError,
  validateContent,
  type ChangeOp,
  type CollectionName,
  type ContentIssue,
  type RawContent,
} from "@canopy/site-contract";
import { formatIssues, readContent, validateSite, writeContent } from "@canopy/site-contract/node";
import { fetchBranch, git, gitEnv, resetTree, resolveRepo, showFile, syncClone, type Clone, type RepoRef } from "./git.ts";
import { buildEnv, Log, run, StepError } from "./run.ts";
import { claimOutput, handOver, insideBuilds, keepPrivate, sealBuild, siteUser, stopAll, type SiteUser } from "./sandbox.ts";

export const SITES_ROOT = process.env.SITES_ROOT ?? "/srv/sites";
const RETAIN = Number(process.env.BUILDS_RETAINED ?? 5);

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const BUILD_ID = /^[a-z0-9]{10,40}$/;

export interface SiteRef {
  slug: string;
  repoUrl: string;
  branch: string;
  /** IANA zone: builds run on the site's calendar, and it is rebuilt at its local midnight. */
  timeZone?: string;
}

/** superseded: a newer preview of the same site arrived before this one started. */
export type BuildStatus = "queued" | "running" | "succeeded" | "failed" | "superseded";

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
    git: path.join(root, "git"),
    home: path.join(root, "home"),
    builds: path.join(root, "builds"),
    meta: path.join(root, "meta"),
    preview: path.join(root, "preview"),
    current: path.join(root, "current"),
    lockHash: path.join(root, "lockhash"),
  };
};

const cloneOf = (slug: string): Clone => {
  const d = dirs(slug);
  return { gitDir: d.git, workTree: d.repo };
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

// Fetches and checkouts take the site's git lock, so a content read's fetch
// never lands in the middle of a build syncing its clone. Reads themselves
// take git objects, never the working tree a build is editing.
const gitLocks = new Map<string, Promise<unknown>>();
function withGitLock<T>(slug: string, fn: () => Promise<T>): Promise<T> {
  const prev = gitLocks.get(slug) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(fn);
  gitLocks.set(slug, next);
  return next;
}

/** When each site's clone last fetched; content reads fetch only when it's older than FETCH_TTL_MS. */
const lastFetch = new Map<string, number>();
const FETCH_TTL_MS = Number(process.env.FETCH_TTL_SECONDS ?? 60) * 1000;

// ---------------------------------------------------------------------------

async function prepare(site: SiteRef, log: Log): Promise<{ ref: RepoRef; env: Record<string, string>; head: string }> {
  if (!SLUG.test(site.slug) || site.slug.length > 40) throw new StepError(`"${site.slug}" is not a site slug`);
  const d = dirs(site.slug);
  await mkdir(d.root, { recursive: true });
  await keepPrivate(d.builds);
  await keepPrivate(d.meta);
  const ref = resolveRepo(site.slug, site.repoUrl, site.branch);
  const env = gitEnv(ref, cloneOf(site.slug));
  const head = await withGitLock(site.slug, () => syncClone(cloneOf(site.slug), ref, env, log));
  await keepPrivate(d.git);
  lastFetch.set(site.slug, Date.now());
  return { ref, env, head };
}

export interface SiteContent {
  commit: string;
  content: RawContent;
  /** SITE_GUIDE.md at the repo root (PRD D31, D40), or null when there is none. */
  guide: string | null;
  contractVersion: string | null;
}

/**
 * The site branch's content, site guide, and contract version, read from
 * git's objects in the working clone (PRD section 7, editor responsiveness):
 * it fetches only when the clone's copy is older than FETCH_TTL_MS or the
 * caller asks to refresh, and never waits behind a build.
 */
export async function readSiteContent(site: SiteRef, opts: { refresh?: boolean } = {}): Promise<SiteContent> {
  await scheduleSite(site);
  const d = dirs(site.slug);
  const cloned = await access(path.join(d.git, "HEAD")).then(
    () => true,
    () => false,
  );
  const ref = resolveRepo(site.slug, site.repoUrl, site.branch);
  const env = gitEnv(ref, cloneOf(site.slug));
  if (!cloned) {
    await enqueue(site.slug, async () => {
      await prepare(site, new Log());
    });
  } else if (opts.refresh || Date.now() - (lastFetch.get(site.slug) ?? 0) > FETCH_TTL_MS) {
    await withGitLock(site.slug, () => fetchBranch(d.repo, ref, env));
    lastFetch.set(site.slug, Date.now());
  }
  const commit = (await git(d.repo, env, ["rev-parse", `refs/remotes/origin/${site.branch}`])).trim();
  const cached = contentCache.get(site.slug);
  if (cached?.commit === commit) return structuredClone(cached);
  const content: RawContent = {};
  const issues: ContentIssue[] = [];
  for (const name of COLLECTION_NAMES) {
    const file = collections[name].file;
    const text = await showFile(d.repo, env, commit, `src/content/${file}`);
    if (text === null) continue;
    try {
      content[name] = JSON.parse(text);
    } catch (err) {
      issues.push({ collection: name, path: "", message: `${file} is not valid JSON: ${(err as Error).message}` });
    }
  }
  if (issues.length) throw new StepError(formatIssues(issues));
  const read: SiteContent = {
    commit,
    content,
    guide: await showFile(d.repo, env, commit, "SITE_GUIDE.md"),
    contractVersion: await installedContractVersion(d.repo, env, commit),
  };
  contentCache.set(site.slug, read);
  return structuredClone(read);
}

/** The last content read per site; a commit names its content exactly, so it never goes stale. */
const contentCache = new Map<string, SiteContent>();

async function installedContractVersion(repoDir: string, env: Record<string, string>, commit: string): Promise<string | null> {
  try {
    const lock = JSON.parse((await showFile(repoDir, env, commit, "package-lock.json")) ?? "{}");
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
  const touched = [...new Set(ops.map(opCollection))].filter(isCollectionName);
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

async function npmCiIfNeeded(slug: string, repoDir: string, user: SiteUser, log: Log) {
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
  // No install scripts: a site's build doesn't need one.
  await run("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"], { cwd: repoDir, env: buildEnv(d.home), log, timeoutMs: 600_000, user });
  await writeFile(d.lockHash, hash);
}

/**
 * The site's install and build, as its own user (sandbox.ts), then its output
 * taken into builds/<id>. Whatever the steps leave running is stopped before
 * the builder touches the tree again.
 */
async function buildAs(site: SiteRef, id: string, log: Log) {
  const d = dirs(site.slug);
  const user = await siteUser(SITES_ROOT, site.slug);
  await handOver(user, d.root, d.repo, d.home);
  try {
    await npmCiIfNeeded(site.slug, d.repo, user, log);
    log.add("Building (astro build)");
    await rm(path.join(d.repo, "dist"), { recursive: true, force: true });
    await run("npm", ["run", "build"], { cwd: d.repo, env: buildEnv(d.home, site.timeZone), log, timeoutMs: 300_000, user });
  } finally {
    await stopAll(user);
  }
  await claimOutput(path.join(d.repo, "dist"));
  await rename(path.join(d.repo, "dist"), path.join(d.builds, id));
  await sealBuild(path.join(d.builds, id));
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
const latestPreview = new Map<string, string>();

export function startPreview(site: SiteRef, id: string, ops: ChangeOp[], baseCommit?: string): BuildRecord {
  const rec: BuildRecord = { id, slug: site.slug, status: "queued", baseCommit, log: "" };
  records.set(id, rec);
  latestPreview.set(site.slug, id);
  const log = new Log();
  enqueue(site.slug, async () => {
    // Newest wins (PRD D38): a preview that a newer one overtook in the queue never runs.
    if (latestPreview.get(site.slug) !== id) {
      rec.status = "superseded";
      rec.finishedAt = new Date().toISOString();
      rec.log = "A newer preview of this site arrived before this one started.";
      await saveRecord(rec).catch(() => undefined);
      records.delete(id);
      return;
    }
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
        await buildAs(site, id, log);
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

/**
 * Puts the branch back at a tag (the demo's baseline between sales calls):
 * hard reset to the tag and force-push. Only tags named `demo-baseline` are
 * accepted, so this can't rewrite a client's history to an arbitrary ref.
 * The caller rebuilds and publishes afterwards.
 */
export function resetToTag(site: SiteRef, tag: string): Promise<{ commit: string }> {
  return enqueue(site.slug, async () => {
    if (tag !== "demo-baseline") throw new StepError("Only the demo-baseline tag can be reset to");
    const log = new Log();
    const d = dirs(site.slug);
    const { env } = await prepare(site, log);
    await git(d.repo, env, ["fetch", "origin", `+refs/tags/${tag}:refs/tags/${tag}`], log);
    await git(d.repo, env, ["reset", "-q", "--hard", `refs/tags/${tag}`], log);
    await git(d.repo, env, ["push", "--force", "origin", `HEAD:refs/heads/${site.branch}`], log);
    return { commit: (await git(d.repo, env, ["rev-parse", "HEAD"])).trim() };
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
  return target ? insideBuilds(d.builds, path.join(d.builds, target)) : null;
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

// ---------------------------------------------------------------------------
// The nightly rebuild (PRD D42). A static page shows what is current on its
// build date, so an announcement that starts or ends overnight changes only
// when something rebuilds. Each site's published build is rebuilt from its
// branch at the site's local midnight. The portal sends each site's time zone
// with every content read, which registers it here; the schedule lives on the
// volume so it survives a restart.

interface Scheduled {
  slug: string;
  repoUrl: string;
  branch: string;
  timeZone: string;
  /** The local date (YYYY-MM-DD) of the last nightly rebuild, or of registration. */
  lastNightly: string;
}

const SCHEDULE_FILE = path.join(SITES_ROOT, "schedule.json");
let schedule: Record<string, Scheduled> | null = null;

function validTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz || tz.length > 60) return false;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Today's date in a time zone, as YYYY-MM-DD. */
export function localDate(timeZone: string, at = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

async function loadSchedule(): Promise<Record<string, Scheduled>> {
  if (!schedule) schedule = JSON.parse(await readFile(SCHEDULE_FILE, "utf8").catch(() => "{}")) as Record<string, Scheduled>;
  return schedule;
}

async function saveSchedule() {
  await writeFile(SCHEDULE_FILE, JSON.stringify(schedule ?? {}, null, 2));
}

/** Records a site for the nightly rebuild, or updates its repo, branch, or time zone. */
export async function scheduleSite(site: SiteRef) {
  if (!validTimeZone(site.timeZone)) return;
  const all = await loadSchedule();
  const cur = all[site.slug];
  if (cur && cur.repoUrl === site.repoUrl && cur.branch === site.branch && cur.timeZone === site.timeZone) return;
  all[site.slug] = {
    slug: site.slug,
    repoUrl: site.repoUrl,
    branch: site.branch,
    timeZone: site.timeZone,
    lastNightly: cur?.lastNightly ?? localDate(site.timeZone),
  };
  await saveSchedule();
}

/**
 * Rebuilds a site's branch and points `current` at the result, the published
 * site on a new day. A site never published is left alone, and a failed
 * build leaves `current` where it was.
 */
export function rebuildCurrent(site: SiteRef): Promise<string | null> {
  return enqueue(site.slug, async () => {
    const d = dirs(site.slug);
    if (!(await linkTarget(d.current))) return null;
    const id = `n${Date.now().toString(36)}${randomBytes(4).toString("hex")}`;
    const log = new Log();
    const { env } = await prepare(site, log);
    try {
      const check = await validateSite(d.repo);
      if (!check.ok) throw new ContentError(check.issues);
      await buildAs(site, id, log);
    } finally {
      await resetTree(d.repo, env).catch(() => undefined);
    }
    await pointAt(d.current, path.join("builds", id));
    await prune(site.slug);
    return id;
  });
}

async function nightlyTick() {
  const all = await loadSchedule();
  for (const entry of Object.values(all)) {
    const today = localDate(entry.timeZone);
    if (entry.lastNightly >= today) continue;
    entry.lastNightly = today;
    await saveSchedule();
    rebuildCurrent(entry).then(
      (id) => console.log(JSON.stringify({ event: "nightly_rebuild", slug: entry.slug, date: today, build: id })),
      (err) => console.error(JSON.stringify({ event: "nightly_rebuild_failed", slug: entry.slug, date: today, message: (err as Error).message })),
    );
  }
}

/** Checks every minute for sites whose local date has turned over. */
export function startNightlyRebuilds() {
  const tick = () => nightlyTick().catch((err) => console.error(JSON.stringify({ event: "nightly_tick_failed", message: (err as Error).message })));
  setTimeout(tick, 10_000).unref();
  setInterval(tick, 60_000).unref();
}
