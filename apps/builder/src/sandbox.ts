import { chmod, chown, lstat, mkdir, readdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { run, StepError } from "./run.ts";

/**
 * A site's own build steps (npm ci, npm run build) run as that site's own
 * unprivileged user. The builder allocates one per site, records it on the
 * volume, and hands the user nothing but the site's working tree and home:
 * git's directory, the builds, the volume's records, and every other site
 * stay with the builder. After each step, whatever the step left running is
 * stopped, so the builder only ever touches a tree no build is using.
 */

export interface SiteUser {
  uid: number;
  gid: number;
}

const FIRST_UID = 20001;
let allocating: Promise<unknown> = Promise.resolve();

/** The site's build user, allocated on first use. Ids are never reused. */
export function siteUser(sitesRoot: string, slug: string): Promise<SiteUser> {
  const next = allocating.then(async () => {
    const file = path.join(sitesRoot, "uids.json");
    const uids = JSON.parse(await readFile(file, "utf8").catch(() => "{}")) as Record<string, number>;
    if (!uids[slug]) {
      uids[slug] = Math.max(FIRST_UID - 1, ...Object.values(uids)) + 1;
      await writeFile(file, JSON.stringify(uids, null, 2), { mode: 0o600 });
    }
    return { uid: uids[slug], gid: uids[slug] };
  });
  allocating = next.catch(() => undefined);
  return next;
}

/** Keeps a directory the builder's alone: owned by it, closed to everyone else. */
export async function keepPrivate(dir: string) {
  await mkdir(dir, { recursive: true });
  await chown(dir, 0, 0);
  await chmod(dir, 0o700);
}

/**
 * Gives the working tree and home to the site's user just before its steps
 * run. The site's own directory stays the builder's, traversable but not
 * listable, so the user reaches its two directories and nothing beside them.
 */
export async function handOver(user: SiteUser, siteDir: string, workTree: string, home: string) {
  await chown(siteDir, 0, 0);
  await chmod(siteDir, 0o711);
  await mkdir(path.join(home, "tmp"), { recursive: true });
  await run("chown", ["-R", `${user.uid}:${user.gid}`, workTree, home], { cwd: "/", env: { PATH: process.env.PATH ?? "/usr/bin:/bin" } });
  await chmod(workTree, 0o700);
  await chmod(home, 0o700);
}

/** Stops every process the site's user still has, including anything a step left behind. */
export async function stopAll(user: SiteUser) {
  for (let round = 0; round < 10; round++) {
    const pids = await processesOf(user.uid);
    if (!pids.length) return;
    for (const pid of pids) {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        // Already gone.
      }
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new StepError("A build step left processes that wouldn't stop");
}

async function processesOf(uid: number): Promise<number[]> {
  const pids: number[] = [];
  for (const entry of await readdir("/proc")) {
    if (!/^\d+$/.test(entry)) continue;
    const status = await readFile(`/proc/${entry}/status`, "utf8").catch(() => "");
    // A zombie holds no resources and can't run; it only waits to be reaped.
    if (/^State:\s+Z/m.test(status)) continue;
    const ids = /^Uid:\s+(\d+)\s+(\d+)\s+(\d+)/m.exec(status);
    if (ids && ids.slice(1).some((id) => Number(id) === uid)) pids.push(Number(entry));
  }
  return pids;
}

/**
 * Takes a finished build's output for the builder: it must be a real
 * directory (a symlink would point the build's files anywhere), and once
 * moved under the builds it belongs to the builder, so no later build changes it.
 */
export async function claimOutput(dist: string) {
  const info = await lstat(dist).catch(() => null);
  if (!info) throw new StepError("The build produced no dist directory");
  if (!info.isDirectory()) throw new StepError("The build's dist is not a directory");
}

export async function sealBuild(buildDir: string) {
  const env = { PATH: process.env.PATH ?? "/usr/bin:/bin" };
  await run("chown", ["-R", "0:0", buildDir], { cwd: "/", env });
  await run("chmod", ["-R", "go-w", buildDir], { cwd: "/", env });
}

/** A build directory's real path, only when it really is inside the site's builds. */
export async function insideBuilds(buildsDir: string, buildDir: string): Promise<string | null> {
  try {
    const [base, real] = await Promise.all([realpath(buildsDir), realpath(buildDir)]);
    if (path.dirname(real) !== base) return null;
    return (await lstat(real)).isDirectory() ? real : null;
  } catch {
    return null;
  }
}
