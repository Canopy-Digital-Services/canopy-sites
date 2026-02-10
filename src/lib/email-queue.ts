import { sendNewSubmissionNotification } from "./email";

/**
 * Queue a minimal notification to account owner
 * Looks up account email and sends notification without submission data
 */
export function queueNewSubmissionNotification(
  formId: string,
  formName: string,
  submissionTimestamp: Date,
  accountId: string
): void {
  // Fire and forget - don't await
  (async () => {
    try {
      const { prisma } = await import("@/lib/db");
      
      const user = await prisma.user.findFirst({
        where: { accountId },
        select: { email: true },
      });
      
      if (!user) {
        console.warn(`No user found for account ${accountId}, skipping notification`);
        return;
      }
      
      const success = await sendNewSubmissionNotification(
        formId,
        formName,
        submissionTimestamp,
        user.email
      );
      
      if (success) {
        console.log(`✅ New submission notification queued for ${user.email}`);
      }
    } catch (error) {
      console.error("New submission notification queue error:", error);
    }
  })();
}
