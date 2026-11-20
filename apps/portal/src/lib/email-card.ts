/**
 * The card an email to a person is laid out in: an optional picture, a
 * heading, a line or two, one button, and a note under it. The claim and
 * reset emails share it, so a person's first email and their later ones look
 * like one product.
 *
 * Tables and inline styles are what Outlook and Gmail both lay out. Colors
 * are hex on purpose: a mail client loads no `globals.css`.
 */

export interface EmailCard {
  /** Shown across the top at the card's width, linked like the button. `src` is a URL or a `cid:` the message carries. */
  picture?: { src: string; alt: string };
  heading: string;
  body: string;
  button: { label: string; url: string };
  /** Under the button, in smaller grey type. */
  note: string;
  footer: string;
}

/** The plain-text part: the same words, with the link spelled out where the button is. `lead` is whatever the body says that isn't about the button. */
export function emailCardText({ heading, lead, button, note, footer }: Pick<EmailCard, "heading" | "button" | "note" | "footer"> & { lead?: string | null }): string {
  return [heading, ...(lead ? ["", lead] : []), "", `${button.label}: ${button.url}`, "", note, "", "---", footer].join("\n");
}

export function emailCardHtml({ picture, heading, body, button, note, footer }: EmailCard): string {
  const url = escapeHtml(button.url);
  // A 1200 by 630 picture, shown at the card's width.
  const top = picture
    ? `
        <tr>
          <td style="font-size: 0; line-height: 0;">
            <a href="${url}"><img src="${escapeHtml(picture.src)}" width="560" alt="${escapeHtml(picture.alt)}" style="display: block; width: 100%; max-width: 560px; height: auto; border: 0;"></a>
          </td>
        </tr>`
    : "";
  return `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background: #f2f5f4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f2f5f4;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 560px; background: #ffffff; border-radius: 12px; overflow: hidden; font-family: Arial, sans-serif; line-height: 1.6; color: #1d1d1f;">${top}
        <tr>
          <td style="padding: 28px 32px 24px;">
            <h1 style="margin: 0 0 8px; font-size: 28px; line-height: 1.25; color: #005e69;">${escapeHtml(heading)}</h1>
            <p style="margin: 0; font-size: 16px;">${escapeHtml(body)}</p>
            <p style="margin: 24px 0;">
              <a href="${url}" style="background: #005e69; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: bold;">${escapeHtml(button.label)}</a>
            </p>
            <p style="margin: 0; color: #666; font-size: 14px;">${escapeHtml(note)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 32px; border-top: 1px solid #eee; color: #999; font-size: 12px;">${escapeHtml(footer)}</td>
        </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
