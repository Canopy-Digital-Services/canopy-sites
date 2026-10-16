"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, getCurrentAccountId } from "@/lib/auth-utils";
import { getAccountEntitlements } from "@/lib/data-access/entitlements";
import { discardChange, publishChange, refreshChange, ToolError, type ToolContext } from "@/lib/site-tools";
import { QuickEditError, runQuickEdit } from "@/lib/quick-edit";

/**
 * The Editor's actions. Each resolves the account from the session and goes
 * through the site tool layer, which enforces ownership and the guardrails.
 * Refusals come back as { error } so their text survives a production build.
 */

type Result<T> = ({ success: true } & T) | { error: string };

async function context(): Promise<ToolContext & { userId: string; email: string }> {
  const session = await requireAuth();
  const accountId = await getCurrentAccountId();
  const { sitesEnabled } = await getAccountEntitlements(accountId);
  if (!sitesEnabled) throw new ToolError("This account doesn't have Canopy Sites.");
  return { accountId, userId: session.user.id, email: session.user.email, source: "QUICK_EDIT" };
}

function failure(err: unknown): { error: string } {
  if (err instanceof ToolError || err instanceof QuickEditError) return { error: err.message };
  console.error(JSON.stringify({ event: "site_editor_error", message: (err as Error).message }));
  return { error: "Something went wrong. Try again in a moment." };
}

export async function sendQuickEdit(input: {
  conversationId: string | null;
  message: string;
}): Promise<Result<{ conversationId: string; reply: string; changeSetId: string | null }>> {
  try {
    const ctx = await context();
    const result = await runQuickEdit(ctx, { conversationId: input.conversationId, message: String(input.message ?? "") });
    if (result.changeSetId) revalidatePath("/editor");
    return { success: true, ...result };
  } catch (err) {
    return failure(err);
  }
}

export async function refreshPendingChange(changeSetId: string): Promise<Result<{ status: string; reason: string | null }>> {
  try {
    const ctx = await context();
    const { status, error } = await refreshChange(ctx.accountId, String(changeSetId));
    return { success: true, status, reason: error };
  } catch (err) {
    return failure(err);
  }
}

export async function publishPendingChange(changeSetId: string): Promise<Result<{ commit: string | null }>> {
  try {
    const ctx = await context();
    const result = await publishChange(ctx, String(changeSetId), { name: ctx.email.split("@")[0], email: ctx.email });
    revalidatePath("/editor");
    return { success: true, ...result };
  } catch (err) {
    return failure(err);
  }
}

export async function discardPendingChange(changeSetId: string): Promise<Result<object>> {
  try {
    const ctx = await context();
    await discardChange(ctx.accountId, String(changeSetId));
    revalidatePath("/editor");
    return { success: true };
  } catch (err) {
    return failure(err);
  }
}
