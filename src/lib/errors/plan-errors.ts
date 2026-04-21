/**
 * Typed errors for plan enforcement. Server actions throw these; the
 * client pattern-matches on .name or the error code prefix in .message to
 * decide between a friendly upsell and a generic failure toast.
 *
 * Next.js serializes thrown errors to the client as plain Error instances
 * with the message intact, so the message carries a stable "CODE: text"
 * prefix that survives the boundary.
 */

export const PLAN_ERROR_CODES = {
  MAX_PUBLISHED_FORMS_REACHED: "MAX_PUBLISHED_FORMS_REACHED",
  PLAN_RESOLUTION_REQUIRED: "PLAN_RESOLUTION_REQUIRED",
} as const;

export type PlanErrorCode =
  (typeof PLAN_ERROR_CODES)[keyof typeof PLAN_ERROR_CODES];

export class PlanLimitError extends Error {
  code: PlanErrorCode;
  planCode: string;
  maxPublishedForms: number | null;

  constructor(params: {
    code: PlanErrorCode;
    planCode: string;
    maxPublishedForms: number | null;
    message?: string;
  }) {
    const message =
      params.message ??
      `${params.code}: plan ${params.planCode} limit reached.`;
    super(message);
    this.name = "PlanLimitError";
    this.code = params.code;
    this.planCode = params.planCode;
    this.maxPublishedForms = params.maxPublishedForms;
  }
}

export class PlanResolutionRequiredError extends Error {
  code: PlanErrorCode = PLAN_ERROR_CODES.PLAN_RESOLUTION_REQUIRED;

  constructor(message?: string) {
    super(
      message ??
        `${PLAN_ERROR_CODES.PLAN_RESOLUTION_REQUIRED}: choose which forms stay published before continuing.`
    );
    this.name = "PlanResolutionRequiredError";
  }
}

/**
 * Client-side helper: given an unknown error thrown across the server-action
 * boundary, detect whether the message carries one of our plan error codes.
 */
export function getPlanErrorCode(error: unknown): PlanErrorCode | null {
  if (!(error instanceof Error)) return null;
  for (const code of Object.values(PLAN_ERROR_CODES)) {
    if (error.message.startsWith(`${code}:`)) return code;
  }
  return null;
}
