/**
 * Centralized copy for plan-related UI strings. Keeps wording consistent
 * between the publish button tooltip, server-action error messages, and
 * the account dashboard.
 */

export function formatPublishDisabledReason(
  planDisplayName: string,
  maxPublishedForms: number | null
): string {
  if (maxPublishedForms === null) {
    return `Your ${planDisplayName} plan does not currently allow publishing.`;
  }
  const forms = maxPublishedForms === 1 ? "form" : "forms";
  return `Your ${planDisplayName} plan allows ${maxPublishedForms} published ${forms}. Unpublish another form first.`;
}

export function formatUsageLine(
  publishedFormsCount: number,
  maxPublishedForms: number | null
): string {
  const cap = maxPublishedForms === null ? "unlimited" : String(maxPublishedForms);
  return `${publishedFormsCount} of ${cap}`;
}
