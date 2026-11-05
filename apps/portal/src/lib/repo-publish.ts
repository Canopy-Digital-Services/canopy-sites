/**
 * Publishing what a site's repo holds, outside any client edit: a linked
 * site's first build (PRD D49), a push made outside the portal, the demo's
 * reset. No session of its own: callers check that an operator asked
 * (`requireGlobalAdmin` in the server actions) and pass the operator's email.
 */

import { prisma } from "@/lib/db";
import { BuilderError, fetchBuild, fetchContent, requestPreview, requestPublish } from "@/lib/builder-client";

const POLL_MS = 1500;
const BUILD_TIMEOUT_MS = 180_000;

/** The site and its builder reference; a BuilderError when it's missing or has no repo. */
export async function operatorSite(siteId: string) {
  const site = await prisma.site.findUnique({ where: { id: String(siteId) } });
  if (!site) throw new BuilderError("That site doesn't exist.");
  if (!site.repoUrl) throw new BuilderError("Set the site's repository first.");
  return { site, ref: { slug: site.slug, repoUrl: site.repoUrl, branch: site.defaultBranch } };
}

/**
 * Builds the branch as it is and makes that build live. Returns the published
 * commit. The Build row comes first, so a failure before the builder starts
 * (no access to the repo, no builder) is on the site page too, not only in a
 * toast.
 */
export async function buildAndPublish(siteId: string, actorEmail: string): Promise<string> {
  const { site, ref } = await operatorSite(siteId);
  const build = await prisma.build.create({ data: { siteId: site.id, status: "RUNNING", startedAt: new Date() } });
  const fail = (error: string) =>
    prisma.build.update({ where: { id: build.id }, data: { status: "FAILED", error, finishedAt: new Date() } });

  let commit: string;
  let contractVersion: string | null;
  try {
    ({ commit, contractVersion } = await fetchContent(ref));
    await prisma.build.update({ where: { id: build.id }, data: { baseCommit: commit } });
    await requestPreview(ref, build.id, [], commit);
  } catch (err) {
    await fail(err instanceof BuilderError ? err.message : "Something went wrong talking to the builder.");
    throw err;
  }
  const deadline = Date.now() + BUILD_TIMEOUT_MS;
  let remote = await fetchBuild(site.slug, build.id);
  while (remote.status === "queued" || remote.status === "running") {
    if (Date.now() > deadline) {
      await fail("The build took too long; check the builder log.");
      throw new BuilderError("The build is taking too long; check the builder log.");
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
    remote = await fetchBuild(site.slug, build.id);
  }
  await prisma.build.update({
    where: { id: build.id },
    data: { status: remote.status === "succeeded" ? "SUCCEEDED" : "FAILED", error: remote.error ?? null, log: remote.log.slice(-20_000), finishedAt: new Date() },
  });
  if (remote.status !== "succeeded") throw new BuilderError(remote.error ?? "The build failed.");
  await requestPublish(ref, {
    buildId: build.id,
    ops: [],
    baseCommit: commit,
    message: "Publish the repository as it is",
    authorName: "Canopy",
    authorEmail: actorEmail,
  });
  await prisma.site.update({ where: { id: site.id }, data: { contractVersion } });
  return commit;
}
