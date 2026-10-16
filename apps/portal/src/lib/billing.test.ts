import { describe, expect, it } from "vitest";
import { BILLING_REF_MAX_LENGTH, parseBillingInput } from "./billing";

describe("parseBillingInput", () => {
  it("accepts a known status and trims the reference", () => {
    expect(parseBillingInput("PAST_DUE", "  FB-1042 ")).toEqual({ ok: true, status: "PAST_DUE", billingRef: "FB-1042" });
  });

  it("stores a blank reference as null", () => {
    expect(parseBillingInput("ACTIVE", "   ")).toEqual({ ok: true, status: "ACTIVE", billingRef: null });
  });

  it("rejects an unknown status, including inherited object keys", () => {
    expect(parseBillingInput("SUSPENDED", "").ok).toBe(false);
    expect(parseBillingInput("toString", "").ok).toBe(false);
  });

  it("rejects a reference over the limit", () => {
    expect(parseBillingInput("ACTIVE", "x".repeat(BILLING_REF_MAX_LENGTH + 1)).ok).toBe(false);
    expect(parseBillingInput("ACTIVE", "x".repeat(BILLING_REF_MAX_LENGTH)).ok).toBe(true);
  });
});
