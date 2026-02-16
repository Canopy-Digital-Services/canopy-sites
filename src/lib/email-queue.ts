import { sendNewSubmissionNotification } from "./email";

/**
 * Queue notifications to all listed recipients.
 * Sends one email per recipient for error isolation.
 */
export function queueNewSubmissionNotification(
  formId: string,
  formName: string,
  submissionTimestamp: Date,
  notifyEmails: string[]
): void {
  if (notifyEmails.length === 0) return;

  // Fire and forget - don't await
  (async () => {
    for (const email of notifyEmails) {
      try {
        const success = await sendNewSubmissionNotification(
          formId,
          formName,
          submissionTimestamp,
          email
        );

        if (success) {
          console.log(`New submission notification sent to ${email}`);
        }
      } catch (error) {
        console.error(`New submission notification error for ${email}:`, error);
      }
    }
  })();
}
