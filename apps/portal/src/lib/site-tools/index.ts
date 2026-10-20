/**
 * The site tool layer (E31, PRD D8, D9, D38). Every edit to a site's content,
 * from the canvas, quick edit, or later MCP, goes through these functions,
 * and they are where the guardrails live: the caller's account must own the
 * site, ops must apply, locked fields can't change, the result must pass the
 * contract and the site guide's limits, and writes are rate limited. Nothing
 * else writes content.
 *
 * Every source writes one draft per site (PRD D38): the pending ChangeSet.
 * Its ops are address ops (D36), so the draft survives a rebase onto a Canopy
 * push. The last write to a field wins; writes that arrive together are
 * applied one after the other, never refused.
 *
 * Callers pass the session's account id; never an id from the client.
 */

import {
  addressAt,
  applyChanges,
  COLLECTION_NAMES,
  fieldInfo,
  isAddressOp,
  isCollectionName,
  lockedFieldViolations,
  parseSiteGuide,
  PatchError,
  resolveAddress,
  SiteGuideError,
  toAddressOps,
  validateContent,
  type AddressOp,
  type ChangeOp,
  type ContentIssue,
  type RawContent,
  type SiteGuide,
} from "@canopy/site-contract";
import { z } from "zod";
import type { ChangeSetSource, Prisma, Site } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { BuilderError, fetchBuild, fetchContent, requestPreview, requestPublish, type BuilderSite } from "@/lib/builder-client";

/** A content issue, with the address of the field it is about when there is one. */
export type ToolIssue = ContentIssue & { address?: string };

export class ToolError extends Error {
  issues?: ToolIssue[];
  constructor(message: string, issues?: ToolIssue[]) {
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
/** Canvas saves come a field at a time, so they get far more room than a model's proposals. */
export const SAVES_PER_HOUR = 600;
const MAX_DRAFT_OPS = 200;
const HOUR = 60 * 60 * 1000;

const OPS = ["add", "remove", "replace", "move"] as const;
const PointerOpSchema = z
  .object({
    collection: z.string().refine(isCollectionName, "Unknown collection"),
    op: z.enum(OPS),
    path: z.string().max(300),
    value: z.unknown().optional(),
    from: z.string().max(300).optional(),
  })
  .strict();
const AddressOpSchema = z
  .object({
    op: z.enum(OPS),
    address: z.string().min(1).max(300),
    value: z.unknown().optional(),
    before: z.string().max(60).optional(),
  })
  .strict();
const ProposalOpsSchema = z.array(PointerOpSchema).min(1, "A change needs at least one op").max(50);
const SaveOpsSchema = z.array(AddressOpSchema).min(1, "A change needs at least one op").max(50);

/** A draft op as stored: an address op, and the summary of the proposal it came in, if any. */
type DraftOp = AddressOp & { summary?: string };

const shapeError = (error: z.ZodError) =>
  new ToolError(`The change isn't in the right shape: ${error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);

/** The account's site with what the tools need. Throws when there is none. */
async function siteFor(accountId: string) {
  const site = await prisma.site.findUnique({ where: { accountId } });
  if (!site) throw new ToolError("This account has no site.");
  if (!site.repoUrl) throw new ToolError("This site has no repository set up yet.");
  return site;
}

/** The site with this id when the account owns it (PRD D44), or a ToolError that reveals nothing else. */
async function ownedSite(accountId: string, siteId: string) {
  const site = await prisma.site.findFirst({ where: { id: String(siteId), accountId } });
  if (!site) throw new ToolError("No such site.");
  if (!site.repoUrl) throw new ToolError("This site has no repository set up yet.");
  return site;
}

const builderSite = (site: Pick<Site, "slug" | "repoUrl" | "defaultBranch" | "timeZone">): BuilderSite => ({
  slug: site.slug,
  repoUrl: site.repoUrl ?? "",
  branch: site.defaultBranch,
  timeZone: site.timeZone,
});

function asOps(json: Prisma.JsonValue): ChangeOp[] {
  return (Array.isArray(json) ? json : []) as unknown as ChangeOp[];
}

const isDraftOps = (ops: ChangeOp[]): ops is DraftOp[] => ops.every(isAddressOp);

/** Ops as the builder takes them: no version stamps or summaries. */
const builderOps = (ops: ChangeOp[]): ChangeOp[] =>
  ops.map((op) => (isAddressOp(op) ? { op: op.op, address: op.address, value: op.value, before: op.before } : op));

async function builderCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof BuilderError) throw new ToolError(err.message, err.issues);
    throw err;
  }
}

function guideOf(raw: string | null | undefined, slug: string): SiteGuide {
  try {
    return parseSiteGuide(raw);
  } catch (err) {
    if (!(err instanceof SiteGuideError)) throw err;
    // A slip in Canopy's own file shouldn't stop the owner editing; the contract's caps still hold.
    console.error(JSON.stringify({ event: "site_guide_invalid", slug, message: err.message }));
    return parseSiteGuide(null);
  }
}

interface SiteRead {
  commit: string;
  published: RawContent;
  guide: SiteGuide;
}

async function readSite(site: Site): Promise<SiteRead> {
  const { commit, content, guide } = await builderCall(() => fetchContent(builderSite(site)));
  return { commit, published: content, guide: guideOf(guide, site.slug) };
}

async function pendingChange(siteId: string) {
  return prisma.changeSet.findFirst({
    where: { siteId, status: { in: [...PENDING] } },
    orderBy: { createdAt: "desc" },
    include: { builds: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
}
type Pending = NonNullable<Awaited<ReturnType<typeof pendingChange>>>;

/** Applies ops to published content and runs every guardrail. Returns the content they produce. */
function check(site: Site, published: RawContent, ops: ChangeOp[], guide: SiteGuide): RawContent {
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
  const result = validateContent(after, { limits: guide.limits });
  if (!result.ok) {
    const issues: ToolIssue[] = result.issues.map((i) => {
      try {
        return { ...i, address: addressAt(after as Record<string, unknown>, i.collection, i.path) };
      } catch {
        return i;
      }
    });
    throw new ToolError(`That change doesn't fit the site: ${result.issues.map((i) => `${i.collection}${i.path}: ${i.message}`).join("; ")}`, issues);
  }
  return after;
}

/** Marks a change's unfinished builds as replaced by the one about to start. */
async function supersedeBuilds(tx: Prisma.TransactionClient, changeSetId: string) {
  await tx.build.updateMany({
    where: { changeSetId, status: { in: ["QUEUED", "RUNNING"] } },
    data: { status: "SUPERSEDED", finishedAt: new Date() },
  });
}

/** Asks the builder for a preview; a failure is recorded on the build and returned, not thrown. */
async function startBuild(site: Site, buildId: string, ops: ChangeOp[], baseCommit: string): Promise<string | null> {
  try {
    await requestPreview(builderSite(site), buildId, builderOps(ops), baseCommit);
    return null;
  } catch (err) {
    const message = err instanceof BuilderError ? err.message : "The preview couldn't be started.";
    await prisma.build.update({ where: { id: buildId }, data: { status: "FAILED", error: message, finishedAt: new Date() } });
    return message;
  }
}

/**
 * The site's draft, on the branch's current commit. A draft whose base moved
 * (a Canopy push) is rebased: its ops re-applied to the new content,
 * re-checked, and rebuilt. One that no longer fits, or that still holds the
 * pointer ops of a pre-draft proposal, fails with the reason.
 */
async function syncDraft(site: Site, read: SiteRead): Promise<Pending | null> {
  const pending = await pendingChange(site.id);
  if (!pending || pending.baseCommit === read.commit) return pending;
  const ops = asOps(pending.ops);
  let reason = "The site changed before this was published.";
  if (isDraftOps(ops)) {
    try {
      check(site, read.published, ops, read.guide);
      const version = pending.version + 1;
      const build = await prisma.$transaction(async (tx) => {
        const moved = await tx.changeSet.updateMany({
          where: { id: pending.id, version: pending.version },
          data: { baseCommit: read.commit, version, status: "DRAFT", error: null },
        });
        if (moved.count === 0) return null; // Another request rebased it first.
        await supersedeBuilds(tx, pending.id);
        return tx.build.create({ data: { siteId: site.id, changeSetId: pending.id, baseCommit: read.commit, draftVersion: version } });
      });
      if (build) await startBuild(site, build.id, ops, read.commit);
      return pendingChange(site.id);
    } catch (err) {
      if (!(err instanceof ToolError)) throw err;
      reason = `The site changed and this no longer fits it. ${err.message}`;
    }
  }
  await prisma.changeSet.update({ where: { id: pending.id }, data: { status: "FAILED", error: reason } });
  return null;
}

/** Adds ops to a draft; a replace of an address already replaced takes the earlier one's place. */
function merge(existing: DraftOp[], incoming: AddressOp[], summary?: string): DraftOp[] {
  const out = [...existing];
  for (const op of incoming) {
    const stamped: DraftOp = { ...op, ...(summary ? { summary } : {}) };
    const i = op.op === "replace" ? out.findIndex((o) => o.op === "replace" && o.address === op.address) : -1;
    if (i >= 0) out[i] = stamped;
    else out.push(stamped);
  }
  return out;
}

const render = (content: RawContent, ops: ChangeOp[]) => JSON.stringify(applyChanges(content as Record<string, unknown>, ops));

/** Drops replaces that put a field back to its published value, so an undone edit leaves no trace. */
function dropReverts(published: RawContent, ops: DraftOp[]): DraftOp[] {
  let kept = ops;
  for (const op of ops) {
    if (op.op !== "replace") continue;
    const without = kept.filter((o) => o !== op);
    try {
      if (render(published, without) === render(published, kept)) kept = without;
    } catch {
      // Later ops need it, or the draft doesn't apply; check() reports the latter.
    }
  }
  return kept;
}

const short = (v: unknown) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 60 ? `${s.slice(0, 59)}…` : s;
};

/** The nearest named entry at or above an address: "Haircut" for a price on the menu. */
function ownerName(content: RawContent, address: string): string | null {
  const parts = address.split("/");
  for (let n = parts.length; n > 1; n--) {
    try {
      const node = resolveAddress(content, parts.slice(0, n).join("/")).node as Record<string, unknown> | undefined;
      const name = node && typeof node === "object" ? (node.name ?? node.title ?? node.author) : undefined;
      if (typeof name === "string") return name;
    } catch {
      return null;
    }
  }
  return null;
}

/** A change summary for an op that came without one (the canvas's), from the field's label. */
function describeOp(published: RawContent, after: RawContent, op: AddressOp): string {
  const label = fieldInfo(op.address)?.label ?? op.address.split("/").pop() ?? op.address;
  if (op.op === "replace") {
    const owner = op.address.endsWith("/name") ? null : ownerName(after, op.address);
    return `${owner ? `${owner} ${label.toLowerCase()}` : label}: ${short(op.value)}`;
  }
  if (op.op === "add") {
    const v = (op.value ?? {}) as Record<string, unknown>;
    return `Added ${short(v.name ?? v.message ?? v.quote ?? v.title ?? v.id ?? label)}`;
  }
  const name = ownerName(op.op === "remove" ? published : after, op.address) ?? label;
  return op.op === "remove" ? `Removed ${short(name)}` : `Moved ${short(name)}`;
}

function describeDraft(published: RawContent, after: RawContent, ops: DraftOp[]): string {
  const lines = [...new Set(ops.map((op) => op.summary ?? describeOp(published, after, op)))];
  return lines.join("; ").slice(0, 1000);
}

interface DraftWrite {
  /** The ops to add, or a function that makes them from the draft's content as it stands. */
  ops: AddressOp[] | ((draftContent: RawContent) => AddressOp[]);
  summary?: string;
  conversationId?: string;
  /** A save that changes nothing is fine from the canvas, an error from a proposal. */
  allowNoop?: boolean;
}

export interface DraftWriteResult {
  /** Null when the write undid every change and the draft was dropped. */
  changeSetId: string | null;
  buildId: string | null;
  version: number;
  summary: string;
  /** Set when the preview couldn't be started; the draft is saved regardless. */
  buildError: string | null;
}

/** Two writes that land together: the one that loses the race runs again on top of the winner. */
class WriteRace extends Error {}

async function writeDraft(site: Site, ctx: ToolContext, read: SiteRead, w: DraftWrite): Promise<DraftWriteResult> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await writeDraftOnce(site, ctx, read, w);
    } catch (err) {
      if (!(err instanceof WriteRace)) throw err;
      if (attempt === 5) throw new ToolError("The site is busy with other changes. Try again in a moment.");
    }
  }
}

async function writeDraftOnce(site: Site, ctx: ToolContext, read: SiteRead, w: DraftWrite): Promise<DraftWriteResult> {
  const pending = await syncDraft(site, read);
  let existing: DraftOp[] = [];
  if (pending) {
    const ops = asOps(pending.ops);
    try {
      // A draft from before addresses holds pointer ops; rewrite them on its first new write.
      existing = isDraftOps(ops) ? ops : toAddressOps(read.published as Record<string, unknown>, ops);
    } catch (err) {
      if (err instanceof PatchError) throw new ToolError(err.message);
      throw err;
    }
  }
  const current = pending ? { changeSetId: pending.id, buildId: pending.builds[0]?.id ?? null, version: pending.version, summary: pending.summary } : null;

  let draftContent = read.published;
  try {
    draftContent = existing.length ? (applyChanges(read.published as Record<string, unknown>, existing) as RawContent) : read.published;
  } catch {
    // check() below reports a draft that doesn't apply.
  }
  let incoming: AddressOp[];
  try {
    incoming = typeof w.ops === "function" ? w.ops(draftContent) : w.ops;
  } catch (err) {
    if (err instanceof PatchError) throw new ToolError(err.message);
    throw err;
  }

  const version = (pending?.version ?? 0) + 1;
  const merged = dropReverts(read.published, merge(existing, incoming, w.summary));
  if (merged.length > MAX_DRAFT_OPS) throw new ToolError("This draft holds too many changes. Publish or discard it first.");
  const after = merged.length ? check(site, read.published, merged, read.guide) : read.published;

  if (JSON.stringify(after) === JSON.stringify(draftContent)) {
    if (!w.allowNoop) throw new ToolError("That doesn't change anything on the site.");
    return { changeSetId: current?.changeSetId ?? null, buildId: current?.buildId ?? null, version: current?.version ?? 0, summary: current?.summary ?? "", buildError: null };
  }
  if (JSON.stringify(after) === JSON.stringify(read.published)) {
    // Every change was undone: the draft goes, and the site is as published.
    if (pending) await prisma.changeSet.update({ where: { id: pending.id }, data: { status: "DISCARDED", error: "Every change was undone." } });
    return { changeSetId: null, buildId: null, version: 0, summary: "", buildError: null };
  }

  const summary = describeDraft(read.published, after, merged);
  const conversationId = w.conversationId
    ? (await prisma.conversation.findFirst({ where: { id: w.conversationId, siteId: site.id }, select: { id: true } }))?.id
    : undefined;
  const ops = merged as unknown as Prisma.InputJsonValue;

  const { changeSetId, buildId } = await prisma.$transaction(async (tx) => {
    let changeSetId: string;
    if (pending) {
      const saved = await tx.changeSet.updateMany({
        where: { id: pending.id, version: pending.version, status: { in: [...PENDING] } },
        data: { ops, version, summary, status: "DRAFT", error: null, ...(conversationId && !pending.conversationId ? { conversationId } : {}) },
      });
      if (saved.count === 0) throw new WriteRace();
      await supersedeBuilds(tx, pending.id);
      changeSetId = pending.id;
    } else {
      const created = await tx.changeSet.create({
        data: { siteId: site.id, source: ctx.source, createdByUserId: ctx.userId, conversationId, summary, ops, baseCommit: read.commit, version },
      });
      changeSetId = created.id;
    }
    const build = await tx.build.create({ data: { siteId: site.id, changeSetId, baseCommit: read.commit, draftVersion: version } });
    return { changeSetId, buildId: build.id };
  });

  const buildError = await startBuild(site, buildId, merged, read.commit);
  return { changeSetId, buildId, version, summary, buildError };
}

async function draftView(site: Site) {
  const read = await readSite(site);
  const pending = await syncDraft(site, read);
  let content = read.published;
  if (pending) {
    try {
      content = applyChanges(read.published as Record<string, unknown>, asOps(pending.ops)) as RawContent;
    } catch {
      content = read.published;
    }
  }
  const build = pending?.builds[0];
  return {
    site: { id: site.id, name: site.name, slug: site.slug, isDemo: site.isDemo, lockedFields: site.lockedFields, timeZone: site.timeZone },
    commit: read.commit,
    published: read.published,
    content,
    guide: read.guide,
    pending: pending
      ? {
          id: pending.id,
          summary: pending.summary,
          status: pending.status,
          version: pending.version,
          error: pending.error,
          buildStatus: build?.status ?? null,
          buildVersion: build?.draftVersion ?? null,
        }
      : null,
    collections: COLLECTION_NAMES.filter((c) => c in read.published),
  };
}

/**
 * What the site looks like with its draft applied: what a new proposal builds
 * on. `published` is the branch as it is.
 */
export async function getContentView(accountId: string) {
  return draftView(await siteFor(accountId));
}

/** The same view, for a site named by id (PRD D44). */
export async function getDraftView(accountId: string, siteId: string) {
  return draftView(await ownedSite(accountId, siteId));
}

/**
 * Proposes a change (quick edit, later MCP). The model writes JSON Pointer ops
 * against the draft as it read it; they are rewritten as address ops and
 * added to the site's draft, checked against the published content, and a
 * preview build starts.
 */
export async function proposeChange(ctx: ToolContext, input: { summary: string; ops: unknown; conversationId?: string }) {
  const site = await siteFor(ctx.accountId);
  if (isRateLimited(`site-tools:propose:${ctx.accountId}`, PROPOSALS_PER_HOUR, HOUR)) {
    throw new ToolError("Too many changes in the last hour. Try again later.");
  }
  const summary = input.summary.trim().slice(0, 300);
  if (!summary) throw new ToolError("A change needs a short summary.");
  const parsed = ProposalOpsSchema.safeParse(input.ops);
  if (!parsed.success) throw shapeError(parsed.error);

  const read = await readSite(site);
  const result = await writeDraft(site, ctx, read, {
    ops: (draftContent) => toAddressOps(draftContent as Record<string, unknown>, parsed.data as ChangeOp[]),
    summary,
    conversationId: input.conversationId,
  });
  if (result.buildError) throw new ToolError(result.buildError);
  return { changeSetId: result.changeSetId as string, buildId: result.buildId as string, summary: result.summary, version: result.version };
}

/**
 * Saves canvas edits to the site's draft (PRD D38). The last write to a
 * field wins. Saving a field back to its published value drops that edit;
 * undoing every edit drops the draft.
 */
export async function saveDraft(ctx: ToolContext, siteId: string, input: { ops: unknown }): Promise<DraftWriteResult> {
  const site = await ownedSite(ctx.accountId, siteId);
  if (isRateLimited(`site-tools:save:${ctx.accountId}`, SAVES_PER_HOUR, HOUR)) {
    throw new ToolError("Too many changes in the last hour. Try again later.");
  }
  const parsed = SaveOpsSchema.safeParse(input.ops);
  if (!parsed.success) throw shapeError(parsed.error);
  const read = await readSite(site);
  return writeDraft(site, ctx, read, { ops: parsed.data as AddressOp[], allowNoop: true });
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

const BUILD_STATUS = { queued: "QUEUED", running: "RUNNING", succeeded: "SUCCEEDED", failed: "FAILED", superseded: "SUPERSEDED" } as const;

/**
 * Brings a change's preview status up to date from the builder. A draft
 * becomes PREVIEWED when the build of its current version succeeds. A failed
 * build leaves the draft pending with the reason, so no edit is lost.
 */
export async function refreshChange(accountId: string, changeSetId: string) {
  const changeSet = await ownedChange(accountId, changeSetId);
  const build = changeSet.builds[0];
  const unchanged = { status: changeSet.status, buildStatus: build?.status ?? null, buildVersion: build?.draftVersion ?? null, error: changeSet.error };
  if (!PENDING.includes(changeSet.status as (typeof PENDING)[number]) || !build || (build.status !== "QUEUED" && build.status !== "RUNNING")) {
    return unchanged;
  }
  const remote = await builderCall(() => fetchBuild(changeSet.site.slug, build.id)).catch(() => null);
  if (!remote) return unchanged;
  const buildStatus = BUILD_STATUS[remote.status];
  const done = buildStatus !== "QUEUED" && buildStatus !== "RUNNING";
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
  const current = build.draftVersion === null || build.draftVersion === changeSet.version;
  if (!done || !current || buildStatus === "SUPERSEDED") return { ...unchanged, buildStatus };
  // Only if no save landed meanwhile: a newer version isn't built yet.
  const data = buildStatus === "SUCCEEDED" ? { status: "PREVIEWED" as const, error: null } : { status: "DRAFT" as const, error: remote.error ?? "The preview build failed." };
  const moved = await prisma.changeSet.updateMany({ where: { id: changeSet.id, version: changeSet.version, status: { in: [...PENDING] } }, data });
  if (moved.count === 0) return { ...unchanged, buildStatus };
  return { status: data.status, buildStatus, buildVersion: build.draftVersion, error: data.error };
}

/**
 * Publishes a previewed change from the preview page, the only place Publish
 * lives (PRD D3, D47). `buildId` is the build the page showed: only that
 * build, when it is the change's latest, succeeded, and of the draft's
 * current version, can go live, so an edit made after the page loaded can't
 * be published unseen. The builder refuses if the site moved since.
 */
export async function publishChange(ctx: ToolContext, changeSetId: string, buildId: string, author: { name: string; email: string }) {
  const changeSet = await ownedChange(ctx.accountId, changeSetId);
  const build = changeSet.builds[0];
  const current = build && (build.draftVersion === null || build.draftVersion === changeSet.version);
  if (changeSet.status !== "PREVIEWED" || build?.status !== "SUCCEEDED" || !current) {
    throw new ToolError("Only a change with a finished preview can be published.");
  }
  if (build.id !== buildId) throw new ToolError("The preview changed since this page loaded. Look it over again, then publish.");
  let commit: string | null;
  try {
    ({ commit } = await requestPublish(builderSite(changeSet.site), {
      buildId: build.id,
      ops: builderOps(asOps(changeSet.ops)),
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
          version: pending.version,
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

/**
 * The site for the canvas and the preview page (PRD D47), when this user is a
 * member of its account; else null, which callers answer with a 404.
 */
export async function previewableSite(userId: string, siteId: string) {
  if (!(await canPreviewSite(userId, String(siteId)))) return null;
  return prisma.site.findUnique({
    where: { id: String(siteId) },
    select: { id: true, accountId: true, name: true, slug: true, isDemo: true, productionHostnames: true, repoUrl: true },
  });
}

/** The builds of the site's draft, newest first, or null when it has no draft. */
export async function draftBuildIds(siteId: string): Promise<string[] | null> {
  const pending = await prisma.changeSet.findFirst({
    where: { siteId, status: { in: [...PENDING] } },
    orderBy: { createdAt: "desc" },
    select: { builds: { orderBy: { createdAt: "desc" }, select: { id: true } } },
  });
  return pending ? pending.builds.map((b) => b.id) : null;
}

/**
 * The page a site's draft changes, where Preview opens: the page of the first
 * op under `pages/<id>`, or the home page for a change elsewhere (business
 * details, services) or for no draft.
 */
export async function previewStartPath(accountId: string, siteId: string): Promise<string> {
  const site = await ownedSite(accountId, siteId);
  const pending = await pendingChange(site.id);
  const pageId = asOps(pending?.ops ?? [])
    .map((op) => (isAddressOp(op) ? /^pages\/([^/]+)/.exec(op.address)?.[1] : undefined))
    .find(Boolean);
  if (!pageId) return "/";
  const { published } = await readSite(site);
  const page = (Array.isArray(published.pages) ? published.pages : []).find((p: { id?: unknown }) => p?.id === pageId) as { path?: unknown } | undefined;
  return typeof page?.path === "string" ? page.path.replace(/\/$/, "") || "/" : "/";
}

/**
 * The preview page's view of the site's draft: whether there is one, its
 * build, and whether it can be published. Brings a running build's status up
 * to date from the builder first.
 */
export async function getPreviewState(accountId: string, siteId: string) {
  const site = await ownedSite(accountId, siteId);
  let pending = await pendingChange(site.id);
  if (pending && (pending.builds[0]?.status === "QUEUED" || pending.builds[0]?.status === "RUNNING")) {
    await refreshChange(accountId, pending.id);
    pending = await pendingChange(site.id);
  }
  if (!pending) return { pending: null };
  const build = pending.builds[0];
  return {
    pending: {
      id: pending.id,
      summary: pending.summary,
      status: pending.status,
      error: pending.error,
      buildId: build?.id ?? null,
      buildStatus: build?.status ?? null,
      /** The build Publish would put live, when there is one. */
      publishable: pending.status === "PREVIEWED" && build?.status === "SUCCEEDED" && (build.draftVersion === null || build.draftVersion === pending.version) ? build.id : null,
    },
  };
}
