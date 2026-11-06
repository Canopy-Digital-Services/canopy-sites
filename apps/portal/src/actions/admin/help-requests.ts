"use server";

import { revalidatePath } from "next/cache";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { ToolError } from "@/lib/site-tools";
import { closeHelpRequest } from "@/lib/site-tools/help-requests";

/**
 * The operator closes a request an owner sent from Quick Edit (PRD D34), as
 * done or declined. A note is emailed to the owner from the Sites sender.
 */
export async function closeRequest(
  requestId: string,
  input: { status: "DONE" | "DECLINED"; note: string },
): Promise<{ success: true; emailed: boolean } | { error: string }> {
  const session = await requireGlobalAdmin();
  try {
    const result = await closeHelpRequest({ userId: session.user.id, email: session.user.email }, String(requestId), {
      status: input.status,
      note: input.note,
    });
    console.log(
      JSON.stringify({ event: "closeHelpRequest", actorEmail: session.user.email, requestId, status: input.status, emailed: result.emailed, at: new Date().toISOString() }),
    );
    revalidatePath("/operator/requests");
    revalidatePath("/operator/sites", "layout");
    return { success: true, emailed: result.emailed };
  } catch (err) {
    if (err instanceof ToolError) return { error: err.message };
    throw err;
  }
}
