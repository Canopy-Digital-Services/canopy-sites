/**
 * The site tool layer (E31, PRD D8, D9, D38). Every edit to a site's content,
 * from the canvas, quick edit, or later MCP, goes through these functions,
 * and they are where the guardrails live: the caller's account must own the
 * site, ops must apply, the edit must stay in the lane (PRD D50: Canopy's
 * fields, locks, fixed lists), the result must pass the contract and the site
 * guide's limits, counts, and refused phrases, and writes are rate limited.
 * Nothing else writes content.
 *
 * Every source writes one draft per site (PRD D38): the pending ChangeSet.
 * Its ops are address ops (D36), so the draft survives a rebase onto a Canopy
 * push. One person edits at a time (PRD D64): every write takes or keeps the
 * site's hold for its caller (hold.ts) and is refused while someone else has
 * it, and a publish or a discard that leaves no draft gives it up. The draft
 * is its author's: nobody else adds to it, and anyone on the account
 * publishes or discards it, so one person's unfinished changes never go out
 * inside another's publish. The author's own writes are never refused: the
 * last to a field wins, and ones that arrive together are applied one after
 * the other.
 *
 * Callers pass the session's account id; never an id from the client.
 */

import {
  addressAt,
  applyChanges,
  avoidWarnings,
  refusalIssues,
  COLLECTION_NAMES,
  fieldInfo,
  isAddressOp,
  isCollectionName,
  LaneRuleError,
  laneViolations,
  parseSiteGuide,
  PatchError,
  resolveAddress,
  SiteGuideError,
  toAddressOps,
  validateContent,
  type AddressOp,
  type AvoidWarning,
  type ChangeOp,
  type ContentIssue,
  type LaneViolation,
  type RawContent,
  type SiteGuide,
} from "@canopy/site-contract";
import { z } from "zod";
import { Prisma, type ChangeSetSource, type Site } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { BuilderError, builderConfigured, fetchBuild, fetchContent, requestPreview, requestPublish, type BuilderSite } from "@/lib/builder-client";
import { sessionCanUseAccount } from "@/lib/data-access/memberships";
import { personName } from "@/lib/person";
import { builderFailure } from "./builder-failure";
import { changedFields, type FieldChange } from "./changes";
import { draftNotice, editingNotice } from "@/lib/site-hold-policy";
import { currentHold, extendHold, releaseHold, takeHold } from "./hold";

export type { FieldChange } from "./changes";

/** A content issue, with the address of the field it is about when there is one. */
export type ToolIssue = ContentIssue & { address?: string };

export class ToolError extends Error {
  issues?: ToolIssue[];
  /**
   * Set when the refusal is Canopy's call, not a mistake to fix: the lane
   * (PRD D50) or a phrase the site guide refuses. A model offers the request
   * to Michael (PRD D34); the message itself only says what was refused.
   */
  outOfLane: boolean;
  /** Set when someone else is editing the site (PRD D64): who, as the account's people know them. */
  heldBy?: string;
  /** Set when the site's draft is someone else's to publish or discard first (PRD D64): whose. */
  draftBy?: string;
  constructor(message: string, issues?: ToolIssue[], options: { outOfLane?: boolean; heldBy?: string; draftBy?: string } = {}) {
    super(message);
    this.issues = issues;
    this.outOfLane = options.outOfLane ?? false;
    this.heldBy = options.heldBy;
    this.draftBy = options.draftBy;
  }
}

export interface ToolContext {
  accountId: string;
  userId: string | null;
  source: ChangeSetSource;
  /** Set while an operator acts as the client (PRD D49). */
  actAsId?: string | null;
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

/** The site's dates follow its account's time zone (`Account.timeZone`). */
const withZone = { account: { select: { timeZone: true } } } as const;
type ToolSite = Site & { account: { timeZone: string } };

/** The account's site with what the tools need. Throws when there is none. */
async function siteFor(accountId: string): Promise<ToolSite> {
  const site = await prisma.site.findUnique({ where: { accountId }, include: withZone });
  if (!site) throw new ToolError("This account has no site.");
  if (!site.repoUrl) throw new ToolError("This site has no repository set up yet.");
  return site;
}

/** The site with this id when the account owns it (PRD D44), or a ToolError that reveals nothing else. */
async function ownedSite(accountId: string, siteId: string): Promise<ToolSite> {
  const site = await prisma.site.findFirst({ where: { id: String(siteId), accountId }, include: withZone });
  if (!site) throw new ToolError("No such site.");
  if (!site.repoUrl) throw new ToolError("This site has no repository set up yet.");
  return site;
}

/**
 * The caller holds the site from here, or a ToolError naming who does (PRD
 * D64). Every write calls it before anything else it would refuse or count,
 * so a person who can't edit right now uses up nothing. A caller that is no
 * person never takes the hold, and waits like anyone while a person has it.
 */
async function requireHold(siteId: string, ctx: ToolContext): Promise<void> {
  const holder = ctx.userId ? await takeHold(siteId, ctx.userId) : await currentHold(siteId).then((h) => (h ? { held: false as const, by: h.by } : { held: true as const }));
  if (!holder.held) throw new ToolError(`${editingNotice(holder.by)}.`, undefined, { heldBy: holder.by });
}

/**
 * The site's draft when it is someone else's: last changed by a person who
 * isn't the caller (PRD D64). A draft nobody is recorded on (its author was
 * taken off the account) is nobody's, and anyone carries it on.
 */
async function othersDraft(siteId: string, userId: string | null): Promise<{ by: string; summary: string } | null> {
  const draft = await prisma.changeSet.findFirst({
    where: { siteId, status: { in: [...PENDING] } },
    orderBy: { createdAt: "desc" },
    select: { summary: true, updatedBy: { select: { id: true, name: true, email: true } } },
  });
  if (!draft?.updatedBy || draft.updatedBy.id === userId) return null;
  return { by: personName(draft.updatedBy), summary: draft.summary };
}

/**
 * The caller may add to the site's draft from here (PRD D64): the draft, if
 * there is one, is theirs, and the site is theirs to hold. A draft belongs to
 * the person who made it until it is published or discarded, which anyone on
 * the account may do, so one person's unfinished changes never go out inside
 * another's publish. Checked before the hold, so someone who can't edit
 * doesn't take the site by trying.
 */
async function requireEdit(siteId: string, ctx: ToolContext): Promise<void> {
  const draft = await othersDraft(siteId, ctx.userId);
  if (draft) {
    // Its author still at work is the fuller answer.
    const editor = await otherEditor(siteId, ctx.userId ?? "");
    if (editor) throw new ToolError(`${editingNotice(editor)}.`, undefined, { heldBy: editor });
    throw new ToolError(`${draftNotice(draft.by)}. Publish or discard them first.`, undefined, { draftBy: draft.by });
  }
  await requireHold(siteId, ctx);
}

/**
 * The caller published or discarded, and the site has no draft left: they are
 * done, so the site is free at once rather than when their hold runs out
 * (PRD D64). With a draft still pending (an edit saved while the publish was
 * in flight), they keep it.
 */
async function doneEditing(siteId: string, ctx: ToolContext): Promise<void> {
  if (!ctx.userId) return;
  if ((await prisma.changeSet.count({ where: { siteId, status: { in: [...PENDING] } } })) > 0) return;
  await releaseHold(siteId, ctx.userId);
}

/** The caller may edit the account's site, and holds it from here: what Quick Edit checks before it spends a model call. */
export async function holdSite(ctx: ToolContext): Promise<void> {
  await requireEdit((await siteFor(ctx.accountId)).id, ctx);
}

/** What an editing page needs to know about who has the site (PRD D64). */
export interface SiteEditing {
  /** Who else is making edits, as the account's people know them; null when nobody is, or the viewer is. */
  by: string | null;
  /** Where the draft and the published list stand: a page compares it to tell that the site moved while it wasn't holding it. */
  marker: string;
  hasDraft: boolean;
  /** Whose the draft is, when it is someone else's to publish or discard before the viewer can edit; null otherwise. */
  draftBy: string | null;
  /** What that draft changes, so the viewer sees what they would publish or discard. */
  draftSummary: string | null;
}

async function siteStanding(siteId: string, userId: string | null): Promise<Omit<SiteEditing, "by">> {
  const [last, pending] = await Promise.all([
    prisma.changeSet.findFirst({ where: { siteId }, orderBy: { updatedAt: "desc" }, select: { id: true, version: true, status: true } }),
    prisma.changeSet.findFirst({
      where: { siteId, status: { in: [...PENDING] } },
      orderBy: { createdAt: "desc" },
      select: { summary: true, updatedBy: { select: { id: true, name: true, email: true } } },
    }),
  ]);
  // A preview finishing (DRAFT to PREVIEWED) changes nothing a page shows as content.
  const state = last && PENDING.includes(last.status as (typeof PENDING)[number]) ? "PENDING" : last?.status;
  const theirs = pending?.updatedBy && pending.updatedBy.id !== userId ? pending.updatedBy : null;
  return {
    marker: last ? `${last.id}:${last.version}:${state}` : "",
    hasDraft: pending !== null,
    draftBy: theirs ? personName(theirs) : null,
    draftSummary: theirs && pending ? pending.summary : null,
  };
}

/**
 * Who has the account's site, for an editing page as it renders. Takes
 * nothing: looking at a page never holds a site, so a prefetch or a reload
 * can't lock anyone out. Null for an account without a site.
 */
export async function getSiteEditing(accountId: string, userId: string): Promise<SiteEditing | null> {
  const site = await prisma.site.findUnique({ where: { accountId }, select: { id: true } });
  if (!site) return null;
  const [by, standing] = await Promise.all([otherEditor(site.id, userId), siteStanding(site.id, userId)]);
  return { by, ...standing };
}

/** Where the account's site stands now: what an editing page adopts after its own write, so only someone else's reads as a move. */
export async function getSiteMarker(accountId: string): Promise<string> {
  const site = await prisma.site.findUnique({ where: { accountId }, select: { id: true } });
  return site ? (await siteStanding(site.id, null)).marker : "";
}

/** Who else is making edits on the site, as the account's people know them, or null. Takes nothing. */
export async function otherEditor(siteId: string, userId: string): Promise<string | null> {
  const holder = await currentHold(siteId);
  return holder && holder.userId !== userId ? holder.by : null;
}

/**
 * An editing page asking who has the site (PRD D64). Asking keeps the
 * person's hold going when they have one and never takes one: a page that is
 * only open holds nothing. With `take`, the person has started an edit that
 * hasn't reached the server yet (a field opened in the Editor), and the site
 * becomes theirs unless someone else has it, or the draft is someone else's
 * to publish or discard first. `mine` says whether it is.
 */
export async function keepSiteHold(ctx: ToolContext & { userId: string }, take = false): Promise<SiteEditing & { mine: boolean }> {
  const site = await siteFor(ctx.accountId);
  const standing = await siteStanding(site.id, ctx.userId);
  let mine: boolean;
  let by: string | null = null;
  // Someone else's draft comes first: opening a field doesn't take a site the person can't edit yet.
  if (take && !standing.draftBy) {
    const hold = await takeHold(site.id, ctx.userId);
    mine = hold.held;
    if (!hold.held) by = hold.by;
  } else {
    mine = await extendHold(site.id, ctx.userId);
    if (!mine) by = await otherEditor(site.id, ctx.userId);
  }
  return { by, mine, ...standing };
}

const builderSite = (site: Pick<ToolSite, "slug" | "repoUrl" | "defaultBranch" | "account">): BuilderSite => ({
  slug: site.slug,
  repoUrl: site.repoUrl ?? "",
  branch: site.defaultBranch,
  timeZone: site.account.timeZone,
});

function asOps(json: Prisma.JsonValue): ChangeOp[] {
  return (Array.isArray(json) ? json : []) as unknown as ChangeOp[];
}

const isDraftOps = (ops: ChangeOp[]): ops is DraftOp[] => ops.every(isAddressOp);

/** Ops as the builder takes them: no version stamps or summaries. */
const builderOps = (ops: ChangeOp[]): ChangeOp[] =>
  ops.map((op) => (isAddressOp(op) ? { op: op.op, address: op.address, value: op.value, before: op.before } : op));

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

/** The branch as the builder reads it. A builder failure is a plain try-again for the owner, and logged (`builder-failure.ts`). */
async function readSite(site: ToolSite): Promise<SiteRead> {
  let read: Awaited<ReturnType<typeof fetchContent>>;
  try {
    read = await fetchContent(builderSite(site));
  } catch (err) {
    if (!(err instanceof BuilderError)) throw err;
    throw new ToolError(builderFailure("read", err, { slug: site.slug }));
  }
  const { commit, content, guide, contractVersion } = read;
  // The repo owns its contract version (PRD D24); a Canopy push can move it
  // without the portal publishing anything, so every read records it.
  if (contractVersion && contractVersion !== site.contractVersion) {
    await prisma.site.update({ where: { id: site.id }, data: { contractVersion } });
  }
  return { commit, published: content, guide: guideOf(guide, site.slug) };
}

async function pendingChange(siteId: string) {
  return prisma.changeSet.findFirst({
    where: { siteId, status: { in: [...PENDING] } },
    orderBy: { createdAt: "desc" },
    include: { builds: { orderBy: { createdAt: "desc" }, take: 1 }, updatedBy: { select: { id: true, name: true, email: true } } },
  });
}
type Pending = NonNullable<Awaited<ReturnType<typeof pendingChange>>>;

/** A lane violation as an issue, located in whichever content still has the field. */
function laneIssue(v: LaneViolation, published: RawContent, after: RawContent): ToolIssue {
  const collection = v.address.split("/")[0] as ToolIssue["collection"];
  for (const content of [after, published]) {
    try {
      return { collection, path: resolveAddress(content, v.address).pointer, message: v.message, address: v.address };
    } catch {
      // Not in this one; try the other.
    }
  }
  return { collection, path: "", message: v.message, address: v.address };
}

/** Applies ops to published content and runs every guardrail. Returns the content they produce. */
function check(site: Site, published: RawContent, ops: ChangeOp[], guide: SiteGuide): RawContent {
  let after: RawContent;
  try {
    after = applyChanges(published as Record<string, unknown>, ops) as RawContent;
  } catch (err) {
    if (err instanceof PatchError) throw new ToolError(err.message);
    throw err;
  }
  let lane: LaneViolation[];
  try {
    lane = laneViolations(published, after, { locked: site.lockedFields, fixed: site.fixedLists });
  } catch (err) {
    if (!(err instanceof LaneRuleError)) throw err;
    // A lock or fixed list that isn't an address: the guardrail fails closed, never silently off.
    console.error(JSON.stringify({ event: "site_lane_rule_invalid", slug: site.slug, message: err.message }));
    throw new ToolError("This site can't be edited until Canopy fixes its settings.", undefined, { outOfLane: true });
  }
  if (lane.length) {
    throw new ToolError(`${lane.map((v) => v.message).join("; ")}.`, lane.map((v) => laneIssue(v, published, after)), { outOfLane: true });
  }
  const result = validateContent(after, { limits: guide.limits, counts: guide.counts });
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
  // Checked once the content is valid, and apart from the contract: a refused
  // phrase is Canopy's call, not a mistake to fix.
  const refused = refusalIssues(after, guide.refuse);
  if (refused.length) {
    const issues: ToolIssue[] = refused.map((i) => {
      const issue = { ...i, collection: i.collection as ToolIssue["collection"] };
      try {
        return { ...issue, address: addressAt(after as Record<string, unknown>, issue.collection, i.path) };
      } catch {
        return issue;
      }
    });
    throw new ToolError(`${refused.map((i) => i.message).join("; ")}.`, issues, { outOfLane: true });
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

/**
 * Asks the builder for a preview. A failure is not thrown: the builder's
 * message goes on the build, for the operator's builds card, and the owner's
 * plain sentence is returned.
 */
async function startBuild(site: ToolSite, buildId: string, ops: ChangeOp[], baseCommit: string): Promise<string | null> {
  try {
    await requestPreview(builderSite(site), buildId, builderOps(ops), baseCommit);
    return null;
  } catch (err) {
    const message = err instanceof BuilderError ? err.message : "The preview couldn't be started.";
    await prisma.build.update({ where: { id: buildId }, data: { status: "FAILED", error: message, finishedAt: new Date() } });
    return builderFailure("preview", err, { slug: site.slug, buildId });
  }
}

/**
 * The site's draft, on the branch's current commit. A draft whose base moved
 * (a Canopy push) is rebased: its ops re-applied to the new content,
 * re-checked, and rebuilt. One that no longer fits, or that still holds the
 * pointer ops of a pre-draft proposal, fails with the reason.
 */
async function syncDraft(site: ToolSite, read: SiteRead): Promise<Pending | null> {
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
  /** What this write changed on the site, field by field. */
  changes: FieldChange[];
  /** What the site guide's copy avoids, in text this write changed: the owner's call (D32). */
  warnings: AvoidWarning[];
}

/** Two writes that land together: the one that loses the race runs again on top of the winner. */
class WriteRace extends Error {}

async function writeDraft(site: ToolSite, ctx: ToolContext, read: SiteRead, w: DraftWrite): Promise<DraftWriteResult> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await writeDraftOnce(site, ctx, read, w);
    } catch (err) {
      if (!(err instanceof WriteRace)) throw err;
      if (attempt === 5) throw new ToolError("The site is busy with other changes. Try again in a moment.");
    }
  }
}

async function writeDraftOnce(site: ToolSite, ctx: ToolContext, read: SiteRead, w: DraftWrite): Promise<DraftWriteResult> {
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
    return {
      changeSetId: current?.changeSetId ?? null,
      buildId: current?.buildId ?? null,
      version: current?.version ?? 0,
      summary: current?.summary ?? "",
      buildError: null,
      changes: [],
      warnings: [],
    };
  }
  const { changes, warnings } = report(draftContent, after, read.guide);
  if (JSON.stringify(after) === JSON.stringify(read.published)) {
    // Every change was undone: the draft goes, and the site is as published.
    if (pending) await prisma.changeSet.update({ where: { id: pending.id }, data: { status: "DISCARDED", error: "Every change was undone." } });
    return { changeSetId: null, buildId: null, version: 0, summary: "", buildError: null, changes, warnings: [] };
  }

  const summary = describeDraft(read.published, after, merged);
  const conversationId = w.conversationId
    ? (await prisma.conversation.findFirst({ where: { id: w.conversationId, siteId: site.id }, select: { id: true } }))?.id
    : undefined;
  const ops = merged as unknown as Prisma.InputJsonValue;

  const { changeSetId, buildId } = await prisma
    .$transaction(async (tx) => {
      let changeSetId: string;
      if (pending) {
        const saved = await tx.changeSet.updateMany({
          where: { id: pending.id, version: pending.version, status: { in: [...PENDING] } },
          data: {
            ops,
            version,
            summary,
            status: "DRAFT",
            error: null,
            // The draft is whoever last changed it's to finish (PRD D64).
            ...(ctx.userId ? { updatedByUserId: ctx.userId } : {}),
            ...(conversationId && !pending.conversationId ? { conversationId } : {}),
          },
        });
        if (saved.count === 0) throw new WriteRace();
        await supersedeBuilds(tx, pending.id);
        changeSetId = pending.id;
      } else {
        const created = await tx.changeSet.create({
          data: {
            siteId: site.id,
            source: ctx.source,
            createdByUserId: ctx.userId,
            updatedByUserId: ctx.userId,
            conversationId,
            summary,
            ops,
            baseCommit: read.commit,
            version,
          },
        });
        changeSetId = created.id;
      }
      const build = await tx.build.create({ data: { siteId: site.id, changeSetId, baseCommit: read.commit, draftVersion: version } });
      return { changeSetId, buildId: build.id };
    })
    .catch((err: unknown) => {
      // Another first write made the site's draft just now: the database holds
      // a site to one (the partial index on change_sets), so this one joins it.
      if (!pending && err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw new WriteRace();
      throw err;
    });

  const buildError = await startBuild(site, buildId, merged, read.commit);
  return { changeSetId, buildId, version, summary, buildError, changes, warnings };
}

/** What a write changed, against the draft it started from, and what in it the site's copy avoids. */
function report(before: RawContent, after: RawContent, guide: SiteGuide): { changes: FieldChange[]; warnings: AvoidWarning[] } {
  let warnings: AvoidWarning[] = [];
  try {
    warnings = avoidWarnings(before, after, guide.avoid);
  } catch (err) {
    // Content check() passed is valid; a draft that wasn't is reported there, not here.
    console.error(JSON.stringify({ event: "avoid_warnings_failed", message: (err as Error).message }));
  }
  return { changes: changedFields(before, after), warnings };
}

async function draftView(site: ToolSite) {
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
    site: { id: site.id, name: site.name, slug: site.slug, isDemo: site.isDemo, lockedFields: site.lockedFields, timeZone: site.account.timeZone },
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
 * Tells the builder the zone of the account's site now, after the account's
 * zone changed: the builder keeps each site's zone for the nightly rebuild
 * and takes a new one from any read. Never throws. A builder that can't be
 * reached learns the zone at the site's next read from the Editor or quick
 * edit, so the change that called this still stands.
 */
export async function sendSiteTimeZone(accountId: string): Promise<void> {
  const site = await prisma.site.findUnique({ where: { accountId }, include: withZone });
  if (!site?.repoUrl || !builderConfigured()) return;
  try {
    await fetchContent(builderSite(site));
  } catch (err) {
    console.error(JSON.stringify({ event: "site_time_zone_not_sent", slug: site.slug, message: (err as Error).message }));
  }
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
  await requireEdit(site.id, ctx);
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
  return {
    changeSetId: result.changeSetId as string,
    buildId: result.buildId as string,
    summary: result.summary,
    version: result.version,
    changes: result.changes,
    warnings: result.warnings,
  };
}

/**
 * Saves canvas edits to the site's draft (PRD D38). The last write to a
 * field wins. Saving a field back to its published value drops that edit;
 * undoing every edit drops the draft.
 */
export async function saveDraft(ctx: ToolContext, siteId: string, input: { ops: unknown }): Promise<DraftWriteResult> {
  const site = await ownedSite(ctx.accountId, siteId);
  await requireEdit(site.id, ctx);
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
    where: { id: String(changeSetId), site: { accountId } },
    include: { site: { include: withZone }, builds: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!changeSet) throw new ToolError("No such change.");
  return changeSet;
}

const BUILD_STATUS = { queued: "QUEUED", running: "RUNNING", succeeded: "SUCCEEDED", failed: "FAILED", superseded: "SUPERSEDED" } as const;

/**
 * Brings a change's preview status up to date from the builder. A draft
 * becomes PREVIEWED when the build of its current version succeeds. A failed
 * build leaves the draft pending, so no edit is lost, with a plain line for
 * the owner; the builder's reason stays on the build, for the operator, and
 * goes to the log.
 */
export async function refreshChange(accountId: string, changeSetId: string) {
  const changeSet = await ownedChange(accountId, changeSetId);
  const build = changeSet.builds[0];
  const unchanged = { status: changeSet.status, buildStatus: build?.status ?? null, buildVersion: build?.draftVersion ?? null, error: changeSet.error };
  if (!PENDING.includes(changeSet.status as (typeof PENDING)[number]) || !build || (build.status !== "QUEUED" && build.status !== "RUNNING")) {
    return unchanged;
  }
  const remote = await fetchBuild(changeSet.site.slug, build.id).catch(() => null);
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
  const failed =
    buildStatus === "FAILED" ? builderFailure("build", remote.error ?? "The build failed and gave no reason.", { slug: changeSet.site.slug, buildId: build.id }) : null;
  const current = build.draftVersion === null || build.draftVersion === changeSet.version;
  if (!done || !current || buildStatus === "SUPERSEDED") return { ...unchanged, buildStatus };
  // Only if no save landed meanwhile: a newer version isn't built yet.
  const data = failed === null ? { status: "PREVIEWED" as const, error: null } : { status: "DRAFT" as const, error: failed };
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
  await requireHold(changeSet.siteId, ctx);
  const build = changeSet.builds[0];
  const current = build && (build.draftVersion === null || build.draftVersion === changeSet.version);
  if (changeSet.status !== "PREVIEWED" || build?.status !== "SUCCEEDED" || !current) {
    throw new ToolError("Only a change with a finished preview can be published.");
  }
  if (build.id !== buildId) throw new ToolError("The preview changed since this page loaded. Look it over again, then publish.");
  const sent = asOps(changeSet.ops);
  let commit: string | null;
  try {
    ({ commit } = await requestPublish(builderSite(changeSet.site), {
      buildId: build.id,
      ops: builderOps(sent),
      baseCommit: changeSet.baseCommit,
      message: `${changeSet.summary}\n\nPublished from Canopy Sites by ${author.email}`,
      authorName: author.name,
      authorEmail: author.email,
    }));
  } catch (err) {
    if (err instanceof BuilderError && /changed since/.test(err.message)) {
      // The site moved because this same change went live from another tab:
      // it is published, and that Publish's answer is this one's too.
      const now = await prisma.changeSet.findUnique({ where: { id: changeSet.id }, select: { status: true, publishedCommit: true } });
      if (now?.status === "PUBLISHED") {
        await doneEditing(changeSet.siteId, ctx);
        return { commit: now.publishedCommit };
      }
      // Only the change as it was read: a save that landed since is a draft to keep.
      await prisma.changeSet.updateMany({
        where: { id: changeSet.id, version: changeSet.version, status: "PREVIEWED" },
        data: { status: "FAILED", error: err.message },
      });
      // The one builder message written for the owner: the site moved since the preview.
      throw new ToolError(err.message);
    }
    if (!(err instanceof BuilderError)) throw err;
    throw new ToolError(builderFailure("publish", err, { slug: changeSet.site.slug, changeSetId: changeSet.id }));
  }
  await recordPublish(changeSet, sent, commit, ctx.userId);
  await doneEditing(changeSet.siteId, ctx);
  return { commit };
}

/** One op as the builder got it, to tell what went live from what was saved after. */
const opKey = (op: ChangeOp) => JSON.stringify(builderOps([op])[0]);

/**
 * Records that a change went live, against the row as it is now, not as the
 * publish read it. The change is live whatever its row has become since (a
 * second Publish's refusal, a discard), so it ends PUBLISHED with the ops that
 * were sent. Edits saved while the publish was in flight weren't sent: they
 * become the site's new draft, brought onto the published commit and built.
 */
async function recordPublish(
  changeSet: Awaited<ReturnType<typeof ownedChange>>,
  sent: ChangeOp[],
  commit: string | null,
  publisherId: string | null,
): Promise<void> {
  const published = { status: "PUBLISHED" as const, error: null, publishedCommit: commit, publishedAt: new Date(), publishedByUserId: publisherId };
  // The usual case: nothing was saved since the publish was sent.
  const untouched = await prisma.changeSet.updateMany({ where: { id: changeSet.id, version: changeSet.version }, data: published });
  if (untouched.count === 1) return;

  const went = new Set(sent.map(opKey));
  let kept = false;
  for (let attempt = 0; attempt < 5 && !kept; attempt++) {
    const row = await prisma.changeSet.findUnique({ where: { id: changeSet.id } });
    if (!row) return;
    const pending = PENDING.includes(row.status as (typeof PENDING)[number]);
    const left = pending ? asOps(row.ops).filter((op) => !went.has(opKey(op))) : [];
    kept = await prisma.$transaction(async (tx) => {
      const moved = await tx.changeSet.updateMany({
        where: { id: row.id, version: row.version },
        data: { ...published, ops: sent as unknown as Prisma.InputJsonValue, summary: changeSet.summary, version: changeSet.version },
      });
      if (moved.count === 0) return false; // Another save landed; read the row again.
      await supersedeBuilds(tx, row.id);
      if (left.length) {
        await tx.changeSet.create({
          data: {
            siteId: row.siteId,
            source: row.source,
            // Whoever saved during the publish made it; the row carries them as its last editor.
            createdByUserId: row.updatedByUserId ?? row.createdByUserId,
            updatedByUserId: row.updatedByUserId ?? row.createdByUserId,
            conversationId: row.conversationId,
            summary: leftoverSummary(left),
            ops: left as unknown as Prisma.InputJsonValue,
            // The commit it was typed against: syncDraft below moves it onto the published one.
            baseCommit: changeSet.baseCommit,
            version: 1,
          },
        });
      }
      return true;
    });
    if (!kept || !left.length) continue;
    // The publish stands whatever happens here: a draft this can't build now is
    // rebased and built at the site's next read.
    try {
      const draft = await syncDraft(changeSet.site, await readSite(changeSet.site));
      if (draft && draft.builds.length === 0) {
        const fresh = await prisma.build.create({ data: { siteId: draft.siteId, changeSetId: draft.id, baseCommit: draft.baseCommit, draftVersion: draft.version } });
        await startBuild(changeSet.site, fresh.id, asOps(draft.ops), draft.baseCommit);
      }
    } catch (err) {
      console.error(JSON.stringify({ event: "leftover_draft_not_built", slug: changeSet.site.slug, message: (err as Error).message }));
    }
  }
}

/** A summary for edits kept from a publish, until the draft's next write describes it from the content. */
function leftoverSummary(ops: ChangeOp[]): string {
  const lines = ops.map((op) => {
    if (!isAddressOp(op)) return "A change";
    return (op as DraftOp).summary ?? fieldInfo(op.address)?.label ?? op.address.split("/").pop() ?? op.address;
  });
  return [...new Set(lines)].join("; ").slice(0, 1000);
}

export async function discardChange(ctx: ToolContext, changeSetId: string) {
  const changeSet = await ownedChange(ctx.accountId, changeSetId);
  await requireHold(changeSet.siteId, ctx);
  if (!PENDING.includes(changeSet.status as (typeof PENDING)[number])) throw new ToolError("Only a pending change can be discarded.");
  await prisma.changeSet.update({ where: { id: changeSet.id }, data: { status: "DISCARDED" } });
  await doneEditing(changeSet.siteId, ctx);
}

/**
 * The pending change and recent history for the Editor. `by` on the draft is
 * who last changed it when that isn't the viewer (PRD D64), and on a
 * published change who published it.
 */
export async function getEditorChanges(accountId: string, viewerId?: string) {
  const site = await prisma.site.findUnique({ where: { accountId }, select: { id: true } });
  if (!site) return { pending: null, recent: [] };
  const [pending, recent] = await Promise.all([
    pendingChange(site.id),
    prisma.changeSet.findMany({
      where: { siteId: site.id, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 10,
      select: { id: true, summary: true, publishedAt: true, publishedBy: { select: { email: true, name: true } } },
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
          by: pending.updatedBy && pending.updatedBy.id !== viewerId ? personName(pending.updatedBy) : null,
        }
      : null,
    recent: recent.map((c) => ({ id: c.id, summary: c.summary, publishedAt: c.publishedAt, by: c.publishedBy ? personName(c.publishedBy) : null })),
  };
}

type PreviewSession = Parameters<typeof sessionCanUseAccount>[0];

/**
 * Whether this session may see the site's preview: a member of its account,
 * or a Global Admin acting as it (PRD D49). Membership is checked through
 * memberships.ts, as everywhere else.
 */
export async function canPreviewSite(session: PreviewSession, siteId: string): Promise<boolean> {
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { accountId: true } });
  if (!site) return false;
  return sessionCanUseAccount(session, site.accountId);
}

/**
 * The site for the canvas and the preview page (PRD D47), when this session
 * may use its account; else null, which callers answer with a 404.
 */
export async function previewableSite(session: PreviewSession, siteId: string) {
  if (!(await canPreviewSite(session, String(siteId)))) return null;
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
