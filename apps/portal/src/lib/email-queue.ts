import { sendNewSubmissionNotification } from "./email";
import type { ResponseLine } from "./submission-email";
import { getAccountEntitlements } from "./data-access/entitlements";
import { listAccountMemberEmails } from "./data-access/memberships";
import { appUrlFor, productNameFor } from "./product";

/**
 * Queue notifications to all listed recipients.
 * Sends one email per recipient for error isolation.
 *
 * `responses` and `replyTo` are only supplied when the form opts into
 * full-response emails; leaving them off sends the metadata-only notification.
 */
export function queueNewSubmissionNotification(options: {
  formId: string;
  formName: string;
  accountId: string;
  submittedAt: Date;
  notifyEmails: string[];
  responses?: ResponseLine[] | null;
  replyTo?: string | null;
}): void {
  const {
    formId,
    formName,
    accountId,
    submittedAt,
    notifyEmails,
    responses,
    replyTo,
  } = options;

  if (notifyEmails.length === 0) return;

  // Fire and forget - don't await
  (async () => {
    const dashboardEmails = await getDashboardEmails(accountId);
    const entitlements = await getEmailEntitlements(accountId);
    const appUrl = appUrlFor(entitlements);
    const productName = productNameFor(entitlements);

    for (const email of notifyEmails) {
      try {
        const success = await sendNewSubmissionNotification({
          formId,
          formName,
          submittedAt,
          recipient: email,
          responses,
          replyTo,
          // Recipients can be any address the owner typed in. Only the ones
          // that actually belong to this account get the dashboard link.
          canUseDashboard: dashboardEmails.has(email.trim().toLowerCase()),
          appUrl,
          productName,
        });

        if (success) {
          console.log(`New submission notification sent to ${email}`);
        }
      } catch (error) {
        console.error(`New submission notification error for ${email}:`, error);
      }
    }
  })();
}

/**
 * The account's products, which pick the dashboard host (the Sites host for
 * Sites accounts, so the link reuses the session they normally sign in with)
 * and the product the email names. Falls back to Forms if the lookup fails.
 */
async function getEmailEntitlements(accountId: string): Promise<{ sitesEnabled: boolean }> {
  try {
    return await getAccountEntitlements(accountId);
  } catch (error) {
    console.error(`Entitlement lookup failed for account ${accountId}:`, error);
    return { sitesEnabled: false };
  }
}

/**
 * Emails that can sign in to this account. On failure we return an empty set,
 * which drops the dashboard link — better than linking a recipient somewhere
 * they can't get into.
 */
async function getDashboardEmails(accountId: string): Promise<Set<string>> {
  try {
    return new Set(await listAccountMemberEmails(accountId));
  } catch (error) {
    console.error("Could not resolve account emails for notification:", error);
    return new Set();
  }
}
