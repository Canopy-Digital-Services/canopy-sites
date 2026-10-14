/**
 * Content for new-submission notification emails.
 *
 * Two shapes, chosen per form by `Form.emailIncludeResponses`:
 *   - off (default): metadata only — form name, timestamp, dashboard link.
 *     This is the Epic 4 privacy-focused email and the behavior every existing
 *     form keeps.
 *   - on: every submitted value, plus a Reply-To pointing at the submitter, so
 *     recipients can triage and reply without signing in (Epic 26).
 *
 * Colors are hardcoded hex on purpose. Email clients don't load `globals.css`,
 * so the design tokens aren't available here — these values mirror them.
 */
import { formatFieldValue } from "@/lib/composite-format";
import { isValidEmail } from "@/lib/validation";

/** Shape this module needs from a Field row. */
export type EmailField = {
  name: string;
  type: string;
  label: string;
  options: unknown;
};

export type ResponseLine = {
  label: string;
  value: string;
};

/** Stands in for an optional question the submitter left empty. */
const BLANK_VALUE = "(blank)";

const BRAND_TEAL = "#005F6A";
const TEXT = "#181818";
const TEXT_MUTED = "#767676";
const BORDER = "#E0E0E0";
const SUNKEN = "#F4F4F5";

/**
 * Build the response list and Reply-To address for a submission.
 * Fields are listed in form order, including ones left blank, so recipients can
 * see which optional questions went unanswered. The honeypot is never shown.
 */
export function buildSubmissionEmailExtras(
  fields: EmailField[],
  data: Record<string, unknown>,
  honeypotField?: string | null
): { responses: ResponseLine[]; replyTo: string | null } {
  const visible = fields.filter((f) => f.name !== honeypotField);

  const responses = visible.map((field) => ({
    label: field.label || field.name,
    value: formatFieldValue(field.type, data[field.name], field.options) || BLANK_VALUE,
  }));

  return { responses, replyTo: pickReplyTo(visible, data) };
}

/**
 * First EMAIL field holding a usable address, in form order.
 * Values are re-validated here rather than trusted: the single-field submit
 * endpoint only checks that required fields are present, so an EMAIL value can
 * reach this point without having passed a format check.
 */
function pickReplyTo(
  fields: EmailField[],
  data: Record<string, unknown>
): string | null {
  for (const field of fields) {
    if (field.type !== "EMAIL") continue;
    const raw = data[field.name];
    if (typeof raw !== "string") continue;
    const candidate = raw.trim();
    if (isValidEmail(candidate)) return candidate;
  }
  return null;
}

/**
 * Render the notification body. Passing no responses yields the metadata-only
 * plain-text email; passing responses adds an HTML part as well, since a list
 * of values is much easier to read as a table.
 *
 * `submissionsUrl` is null for recipients with no account on this form's
 * account — they can't sign in, so a dashboard link would only dead-end them.
 */
export function renderNotificationEmail(input: {
  formName: string;
  submittedAt: Date;
  submissionsUrl: string | null;
  responses?: ResponseLine[] | null;
}): { text: string; html?: string } {
  const { formName, submittedAt, submissionsUrl, responses } = input;
  const timestamp = submittedAt.toLocaleString();

  if (!responses || responses.length === 0) {
    return { text: renderText(formName, timestamp, submissionsUrl, null) };
  }

  return {
    text: renderText(formName, timestamp, submissionsUrl, responses),
    html: renderHtml(formName, timestamp, submissionsUrl, responses),
  };
}

function renderText(
  formName: string,
  timestamp: string,
  submissionsUrl: string | null,
  responses: ResponseLine[] | null
): string {
  const blocks = [
    "New form submission received.",
    `Form: ${formName}\nDate: ${timestamp}`,
  ];

  if (responses) {
    const lines = responses.map(({ label, value }) =>
      // Keep multi-line answers (textareas) on their own lines so the label
      // doesn't get buried in the middle of a paragraph.
      value.includes("\n") ? `${label}:\n${value}` : `${label}: ${value}`
    );
    blocks.push(`Responses:\n\n${lines.join("\n\n")}`);
  }

  if (submissionsUrl) {
    blocks.push(`View submissions: ${submissionsUrl}`);
  }

  blocks.push("---\nThis is an automated notification from Canopy Forms.");

  return blocks.join("\n\n");
}

function renderHtml(
  formName: string,
  timestamp: string,
  submissionsUrl: string | null,
  responses: ResponseLine[]
): string {
  const rows = responses
    .map(
      ({ label, value }) => `
          <tr>
            <td style="padding:12px 8px 12px 24px;font-size:12px;line-height:1.5;color:${TEXT_MUTED};vertical-align:top;width:34%;border-top:1px solid ${BORDER};">${escapeHtml(label)}</td>
            <td style="padding:12px 24px 12px 8px;font-size:14px;line-height:1.5;color:${TEXT};vertical-align:top;white-space:pre-wrap;border-top:1px solid ${BORDER};">${escapeHtml(value)}</td>
          </tr>`
    )
    .join("");

  const linkRow = submissionsUrl
    ? `
    <tr>
      <td style="padding:20px 24px;border-top:1px solid ${BORDER};">
        <a href="${escapeHtml(submissionsUrl)}" style="font-size:14px;color:${BRAND_TEAL};">View in dashboard</a>
      </td>
    </tr>`
    : "";

  return `<div style="margin:0;padding:24px;background:${SUNKEN};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;border-collapse:collapse;background:#FFFFFF;border:1px solid ${BORDER};border-radius:2px;">
    <tr>
      <td style="padding:20px 24px;">
        <div style="font-size:16px;font-weight:600;color:${BRAND_TEAL};">New submission</div>
        <div style="font-size:14px;color:${TEXT};margin-top:6px;">${escapeHtml(formName)}</div>
        <div style="font-size:12px;color:${TEXT_MUTED};margin-top:2px;">${escapeHtml(timestamp)}</div>
      </td>
    </tr>${rows}${linkRow}
  </table>
  <div style="max-width:600px;margin:16px auto 0;font-size:12px;color:${TEXT_MUTED};text-align:center;">
    This is an automated notification from Canopy Forms.
  </div>
</div>`;
}

/**
 * Submitted values are attacker-controlled and go straight into markup.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
