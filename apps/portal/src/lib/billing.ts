import type { AccountStatus } from "@prisma/client";

/** Operator-facing labels, in the order the picker lists them. */
export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: "Active",
  PAST_DUE: "Past due",
  CANCELLED: "Cancelled",
};

export const BILLING_REF_MAX_LENGTH = 200;

export type BillingInput =
  | { ok: true; status: AccountStatus; billingRef: string | null }
  | { ok: false; error: string };

/** Validates operator billing input: a known status, and a trimmed reference that is blank (stored as null) or short. */
export function parseBillingInput(status: string, billingRef: string): BillingInput {
  if (!Object.hasOwn(ACCOUNT_STATUS_LABELS, status)) {
    return { ok: false, error: `Unknown account status: ${status}` };
  }
  const ref = billingRef.trim();
  if (ref.length > BILLING_REF_MAX_LENGTH) {
    return { ok: false, error: `Billing reference must be ${BILLING_REF_MAX_LENGTH} characters or fewer.` };
  }
  return { ok: true, status: status as AccountStatus, billingRef: ref || null };
}
