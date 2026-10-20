"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, getCurrentAccountId } from "@/lib/auth-utils";
import { getAccountEntitlements } from "@/lib/data-access/entitlements";
import type { ChangeSetSource } from "@prisma/client";
import { getAccountSite } from "@/lib/data-access/sites";
import { discardChange, getEditorChanges, getPreviewState, publishChange, refreshChange, saveDraft, ToolError, type ToolContext } from "@/lib/site-tools";
import { QuickEditError, runQuickEdit, type QuickEditScope } from "@/lib/quick-edit";

/**
 * The Editor's actions. Each resolves the account from the session and goes
 * through the site tool layer, which enforces ownership and the guardrails.
 * Refusals come back as { error } so their text survives a production build.
 */

type Result<T> = ({ success: true } & T) | { error: string; issues?: Array<{ address?: string; message: string }> };

async function context(source: ChangeSetSource = "QUICK_EDIT"): Promise<ToolContext & { userId: string; email: string }> {
  const session = await requireAuth();
  const accountId = await getCurrentAccountId();
  const { sitesEnabled } = await getAccountEntitlements(accountId);
  if (!sitesEnabled) throw new ToolError("This account doesn't have Canopy Sites.");
  return { accountId, userId: session.user.id, email: session.user.email, source };
}

function failure(err: unknown): { error: string; issues?: Array<{ address?: string; message: string }> } {
  if (err instanceof ToolError) return { error: err.message, issues: err.issues?.map((i) => ({ address: i.address, message: i.message })) };
  if (err instanceof QuickEditError) return { error: err.message };
  console.error(JSON.stringify({ event: "site_editor_error", message: (err as Error).message }));
  return { error: "Something went wrong. Try again in a moment." };
}

export async function sendQuickEdit(input: {
  conversationId: string | null;
  message: string;
  /** Set when quick edit opens from a field on the Editor's canvas. */
  scope?: QuickEditScope | null;
}): Promise<Result<{ conversationId: string; reply: string; changeSetId: string | null }>> {
  try {
    const ctx = await context();
    const scope = input.scope
      ? { address: String(input.scope.address ?? ""), label: String(input.scope.label ?? ""), value: String(input.scope.value ?? "") }
      : null;
    const result = await runQuickEdit(ctx, { conversationId: input.conversationId, message: String(input.message ?? ""), scope });
    if (result.changeSetId) revalidatePath("/quick-edit");
    return { success: true, ...result };
  } catch (err) {
    return failure(err);
  }
}

export async function refreshPendingChange(
  changeSetId: string,
): Promise<Result<{ status: string; buildStatus: string | null; buildVersion: number | null; reason: string | null }>> {
  try {
    const ctx = await context();
    const { status, buildStatus, buildVersion, error } = await refreshChange(ctx.accountId, String(changeSetId));
    return { success: true, status, buildStatus, buildVersion: buildVersion ?? null, reason: error };
  } catch (err) {
    return failure(err);
  }
}

/**
 * Publish, from the preview page only (PRD D47): the build the page showed,
 * which the tool layer refuses unless it is the draft's current build.
 */
export async function publishPreview(input: { changeSetId: string; buildId: string }): Promise<Result<{ commit: string | null }>> {
  try {
    const ctx = await context();
    const result = await publishChange(ctx, String(input.changeSetId), String(input.buildId), { name: ctx.email.split("@")[0], email: ctx.email });
    revalidatePath("/quick-edit");
    return { success: true, ...result };
  } catch (err) {
    return failure(err);
  }
}

/** The draft as the preview page shows it, for a site named by id (PRD D44). */
export async function getSitePreviewState(siteId: string): Promise<Result<Awaited<ReturnType<typeof getPreviewState>>>> {
  try {
    const ctx = await context();
    return { success: true, ...(await getPreviewState(ctx.accountId, String(siteId))) };
  } catch (err) {
    return failure(err);
  }
}

export async function discardPendingChange(changeSetId: string): Promise<Result<object>> {
  try {
    const ctx = await context();
    await discardChange(ctx.accountId, String(changeSetId));
    revalidatePath("/quick-edit");
    return { success: true };
  } catch (err) {
    return failure(err);
  }
}

/**
 * Saves edits made on the Editor's canvas to the site's draft (PRD D38). A
 * value of null removes an optional field. Whitespace is collapsed: a field
 * is one line of plain text.
 */
export async function saveCanvasEdits(input: {
  siteId: string;
  edits: Array<{ address: string; value: string | null }>;
}): Promise<Result<{ changeSetId: string | null; version: number; buildError: string | null }>> {
  try {
    const ctx = await context("EDITOR");
    const edits = Array.isArray(input.edits) ? input.edits.slice(0, 20) : [];
    const ops = edits.map((e) =>
      e.value === null
        ? { op: "remove", address: String(e.address) }
        : { op: "replace", address: String(e.address), value: String(e.value).replace(/\s+/g, " ").trim() },
    );
    const result = await saveDraft(ctx, String(input.siteId), { ops });
    return { success: true, changeSetId: result.changeSetId, version: result.version, buildError: result.buildError };
  } catch (err) {
    return failure(err);
  }
}

/** The site's draft for the Sites chrome: whether there is one, and its build, with the site's id for Preview. */
export async function getDraftState(): Promise<
  Result<{ siteId: string | null; pending: { id: string; summary: string; status: string; buildStatus: string | null; error: string | null } | null }>
> {
  try {
    const ctx = await context();
    const siteId = (await getAccountSite(ctx.accountId))?.id ?? null;
    const { pending } = await getEditorChanges(ctx.accountId);
    if (pending && pending.status === "DRAFT" && (pending.buildStatus === "QUEUED" || pending.buildStatus === "RUNNING")) {
      const refreshed = await refreshChange(ctx.accountId, pending.id);
      return { success: true, siteId, pending: { id: pending.id, summary: pending.summary, status: refreshed.status, buildStatus: refreshed.buildStatus, error: refreshed.error } };
    }
    return {
      success: true,
      siteId,
      pending: pending ? { id: pending.id, summary: pending.summary, status: pending.status, buildStatus: pending.buildStatus, error: pending.error } : null,
    };
  } catch (err) {
    return failure(err);
  }
}
