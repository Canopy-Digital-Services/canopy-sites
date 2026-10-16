/**
 * The site tool layer (E31, PRD D8 and D9). Every edit to a site's content,
 * from quick edit, the Editor, or later MCP, goes through these functions,
 * and they are where the guardrails live: the caller's account must own the
 * site, ops must apply, locked fields can't change, the result must pass the
 * contract, and proposals are rate limited. Nothing else writes content.
 *
 * Callers pass the session's account id; never an id from the client.
 */

import {
  applyChanges,
  COLLECTION_NAMES,
  isCollectionName,
  lockedFieldViolations,
  PatchError,
  validateContent,
  type ChangeOp,
  type ContentIssue,
  type RawContent,
} from "@canopy/site-contract";
import { z } from "zod";
import type { ChangeSetSource, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { BuilderError, fetchBuild, fetchContent, requestPreview, requestPublish, type BuilderSite } from "@/lib/builder-client";

export class ToolError extends Error {
  issues?: ContentIssue[];
  constructor(message: string, issues?: ContentIssue[]) {
    super(message);
    this.issues = issues;
  }
}

export interface ToolContext {
  accountId: string;
  userId: string | null;
  source: ChangeSetSource;
}

const PENDING = ["DRAFT", "PREVIEWED"] as const;
export const PROPOSALS_PER_HOUR = 40;

const OpSchema = z
  .object({
    collection: z.string().refine(isCollectionName, "Unknown collection"),
    op: z.enum(["add", "remove", "replace", "move"]),
    path: z.string().max(300),
    value: z.unknown().optional(),
    from: z.string().max(300).optional(),
  })
  .strict();
const OpsSchema = z.array(OpSchema).min(1, "A change needs at least one op").max(50);

/** The account's site with what the tools need. Throws when there is none. */
async function siteFor(accountId: string) {
  const site = await prisma.site.findUnique({ where: { accountId } });
  if (!site) throw new ToolError("This account has no site.");
  if (!site.repoUrl) throw new ToolError("This site has no repository set up yet.");
  return site;
}

const builderSite = (site: { slug: string; repoUrl: string | null; defaultBranch: string }): BuilderSite => ({
  slug: site.slug,
  repoUrl: site.repoUrl ?? "",
  branch: site.defaultBranch,
});

function asOps(json: Prisma.JsonValue): ChangeOp[] {
  return (Array.isArray(json) ? json : []) as unknown as ChangeOp[];
}

async function pendingChange(siteId: string) {
  return prisma.changeSet.findFirst({
    where: { siteId, status: { in: [...PENDING] } },
    orderBy: { createdAt: "desc" },
    include: { builds: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
}

async function builderCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof BuilderError) throw new ToolError(err.message, err.issues);
    throw err;
  }
}

/**
 * What the site looks like with the pending change applied: what a new
 * proposal builds on. `published` is the branch as it is.
 */
export async function getContentView(accountId: string) {
  const site = await siteFor(accountId);
  const { commit, content: published } = await builderCall(() => fetchContent(builderSite(site)));
  let pending = await pendingChange(site.id);
  let content = published;
  if (pending && pending.baseCommit !== commit) {
    // The branch moved under it (an operator push); its ops may not fit.
    await prisma.changeSet.update({ where: { id: pending.id }, data: { status: "FAILED", error: "The site changed before this was published." } });
    pending = null;
  }
  if (pending) {
    try {
      content = applyChanges(published as Record<string, unknown>, asOps(pending.ops)) as RawContent;
    } catch {
      content = published;
    }
  }
  return {
    site: { id: site.id, name: site.name, slug: site.slug, isDemo: site.isDemo, lockedFields: site.lockedFields },
    commit,
    published,
    content,
    pending: pending ? { id: pending.id, summary: pending.summary, status: pending.status } : null,
    collections: COLLECTION_NAMES.filter((c) => c in published),
  };
}

/**
 * Proposes a change. The new ops are appended to any pending change, the
 * whole is checked against the published content, and a preview build is
 * started. The previous pending change is superseded.
 */
export async function proposeChange(ctx: ToolContext, input: { summary: string; ops: unknown; conversationId?: string }) {
  const site = await siteFor(ctx.accountId);
  if (isRateLimited(`site-tools:propose:${ctx.accountId}`, PROPOSALS_PER_HOUR, 60 * 60 * 1000)) {
    throw new ToolError("Too many changes in the last hour. Try again later.");
  }
  const summary = input.summary.trim().slice(0, 300);
  if (!summary) throw new ToolError("A change needs a short summary.");
  const parsed = OpsSchema.safeParse(input.ops);
  if (!parsed.success) {
    throw new ToolError(`The change isn't in the right shape: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
  }
  const newOps = parsed.data as ChangeOp[];

  const { commit, content: published } = await builderCall(() => fetchContent(builderSite(site)));
  const pending = await pendingChange(site.id);
  const stacked = pending && pending.baseCommit === commit ? pending : null;
  const ops = [...(stacked ? asOps(stacked.ops) : []), ...newOps];

  let after: RawContent;
  try {
    after = applyChanges(published as Record<string, unknown>, ops) as RawContent;
  } catch (err) {
    if (err instanceof PatchError) throw new ToolError(err.message);
    throw err;
  }
  const locked = lockedFieldViolations(published, after, site.lockedFields);
  if (locked.length) {
    throw new ToolError(`${locked.join(", ")} ${locked.length === 1 ? "is" : "are"} locked. Contact Canopy to change ${locked.length === 1 ? "it" : "them"}.`);
  }
  const result = validateContent(after);
  if (!result.ok) {
    throw new ToolError(
      `That change doesn't fit the site: ${result.issues.map((i) => `${i.collection}${i.path}: ${i.message}`).join("; ")}`,
      result.issues,
    );
  }
  if (JSON.stringify(after) === JSON.stringify(published)) throw new ToolError("That doesn't change anything on the site.");

  const conversationId = input.conversationId
    ? (await prisma.conversation.findFirst({ where: { id: input.conversationId, siteId: site.id }, select: { id: true } }))?.id
    : undefined;

  const { changeSet, build } = await prisma.$transaction(async (tx) => {
    if (pending) {
      await tx.changeSet.update({
        where: { id: pending.id },
        data: stacked ? { status: "DISCARDED", error: "Superseded by a later change." } : { status: "FAILED", error: "The site changed before this was published." },
      });
    }
    const changeSet = await tx.changeSet.create({
      data: {
        siteId: site.id,
        source: ctx.source,
        createdByUserId: ctx.userId,
        conversationId,
        summary: stacked ? `${stacked.summary}; ${summary}`.slice(0, 1000) : summary,
        ops: ops as unknown as Prisma.InputJsonValue,
        baseCommit: commit,
      },
    });
    const build = await tx.build.create({ data: { siteId: site.id, changeSetId: changeSet.id, baseCommit: commit } });
    return { changeSet, build };
  });

  try {
    await requestPreview(builderSite(site), build.id, ops, commit);
  } catch (err) {
    const message = err instanceof BuilderError ? err.message : "The preview couldn't be started.";
    await prisma.$transaction([
      prisma.build.update({ where: { id: build.id }, data: { status: "FAILED", error: message, finishedAt: new Date() } }),
      prisma.changeSet.update({ where: { id: changeSet.id }, data: { status: "FAILED", error: message } }),
    ]);
    throw new ToolError(message);
  }
  return { changeSetId: changeSet.id, buildId: build.id, summary: changeSet.summary };
}

/** A change the account owns, or a ToolError that reveals nothing else. */
async function ownedChange(accountId: string, changeSetId: string) {
  const changeSet = await prisma.changeSet.findFirst({
    where: { id: changeSetId, site: { accountId } },
    include: { site: true, builds: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!changeSet) throw new ToolError("No such change.");
  return changeSet;
}

/**
 * Brings a change's preview status up to date from the builder: DRAFT
 * becomes PREVIEWED when its build succeeds, FAILED when it fails.
 */
export async function refreshChange(accountId: string, changeSetId: string) {
  const changeSet = await ownedChange(accountId, changeSetId);
  const build = changeSet.builds[0];
  if (changeSet.status !== "DRAFT" || !build || (build.status !== "QUEUED" && build.status !== "RUNNING")) {
    return { status: changeSet.status, buildStatus: build?.status ?? null, error: changeSet.error };
  }
  const remote = await builderCall(() => fetchBuild(changeSet.site.slug, build.id)).catch(() => null);
  if (!remote) return { status: changeSet.status, buildStatus: build.status, error: null };
  const buildStatus = ({ queued: "QUEUED", running: "RUNNING", succeeded: "SUCCEEDED", failed: "FAILED" } as const)[remote.status];
  const done = buildStatus === "SUCCEEDED" || buildStatus === "FAILED";
  await prisma.build.update({
    where: { id: build.id },
    data: {
      status: buildStatus,
      error: remote.error ?? null,
      log: done ? remote.log.slice(-20_000) : undefined,
      startedAt: remote.startedAt ? new Date(remote.startedAt) : undefined,
      finishedAt: remote.finishedAt ? new Date(remote.finishedAt) : undefined,
    },
  });
  if (!done) return { status: changeSet.status, buildStatus, error: null };
  const updated = await prisma.changeSet.update({
    where: { id: changeSet.id },
    data: buildStatus === "SUCCEEDED" ? { status: "PREVIEWED" } : { status: "FAILED", error: remote.error ?? "The preview build failed." },
  });
  return { status: updated.status, buildStatus, error: updated.error };
}

/**
 * Publishes a previewed change (PRD D3: the client publishes, after a
 * preview). Only a PREVIEWED change whose latest build succeeded can go live,
 * and the builder refuses if the site moved since that preview.
 */
export async function publishChange(ctx: ToolContext, changeSetId: string, author: { name: string; email: string }) {
  const changeSet = await ownedChange(ctx.accountId, changeSetId);
  const build = changeSet.builds[0];
  if (changeSet.status !== "PREVIEWED" || build?.status !== "SUCCEEDED") {
    throw new ToolError("Only a change with a finished preview can be published.");
  }
  let commit: string | null;
  try {
    ({ commit } = await requestPublish(builderSite(changeSet.site), {
      buildId: build.id,
      ops: asOps(changeSet.ops),
      baseCommit: changeSet.baseCommit,
      message: `${changeSet.summary}\n\nPublished from Canopy Sites by ${author.email}`,
      authorName: author.name,
      authorEmail: author.email,
    }));
  } catch (err) {
    if (err instanceof BuilderError && /changed since/.test(err.message)) {
      await prisma.changeSet.update({ where: { id: changeSet.id }, data: { status: "FAILED", error: err.message } });
    }
    throw err instanceof BuilderError ? new ToolError(err.message) : err;
  }
  await prisma.changeSet.update({
    where: { id: changeSet.id },
    data: { status: "PUBLISHED", publishedCommit: commit, publishedAt: new Date() },
  });
  return { commit };
}

export async function discardChange(accountId: string, changeSetId: string) {
  const changeSet = await ownedChange(accountId, changeSetId);
  if (!PENDING.includes(changeSet.status as (typeof PENDING)[number])) throw new ToolError("Only a pending change can be discarded.");
  await prisma.changeSet.update({ where: { id: changeSet.id }, data: { status: "DISCARDED" } });
}

/** The pending change and recent history for the Editor. */
export async function getEditorChanges(accountId: string) {
  const site = await prisma.site.findUnique({ where: { accountId }, select: { id: true } });
  if (!site) return { pending: null, recent: [] };
  const [pending, recent] = await Promise.all([
    pendingChange(site.id),
    prisma.changeSet.findMany({
      where: { siteId: site.id, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 10,
      select: { id: true, summary: true, publishedAt: true, createdBy: { select: { email: true } } },
    }),
  ]);
  return {
    pending: pending
      ? {
          id: pending.id,
          summary: pending.summary,
          status: pending.status,
          error: pending.error,
          buildStatus: pending.builds[0]?.status ?? null,
          createdAt: pending.createdAt,
        }
      : null,
    recent: recent.map((c) => ({ id: c.id, summary: c.summary, publishedAt: c.publishedAt, by: c.createdBy?.email ?? null })),
  };
}

/** Whether this user may see the site's preview: a member of its account. */
export async function canPreviewSite(userId: string, siteId: string): Promise<boolean> {
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { accountId: true } });
  if (!site) return false;
  const membership = await prisma.membership.findFirst({ where: { userId, accountId: site.accountId }, select: { id: true } });
  return Boolean(membership);
}
