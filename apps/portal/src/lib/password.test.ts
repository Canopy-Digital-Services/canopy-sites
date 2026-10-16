import { describe, expect, it } from "vitest";
import * as bcrypt from "bcrypt";
import { hashPassword, needsRehash, verifyPassword } from "./password";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, passwordProblem } from "./password-policy";

describe("hashPassword / verifyPassword", () => {
  it("produces salted scrypt hashes that verify only the right password", async () => {
    const a = await hashPassword("correct horse battery");
    const b = await hashPassword("correct horse battery");

    expect(a).toMatch(/^scrypt\$15\$8\$3\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(a).not.toBe(b); // per-hash salt
    expect(await verifyPassword("correct horse battery", a)).toBe(true);
    expect(await verifyPassword("correct horse batterY", a)).toBe(false);
  });

  it("does not truncate: passwords sharing a 72-byte prefix differ (bcrypt's limit)", async () => {
    const prefix = "a".repeat(72);
    const hash = await hashPassword(prefix + "one");
    expect(await verifyPassword(prefix + "two", hash)).toBe(false);
  });

  it("still verifies pre-Epic 28 bcrypt hashes", async () => {
    const legacy = await bcrypt.hash("old style pass", 10);
    expect(await verifyPassword("old style pass", legacy)).toBe(true);
    expect(await verifyPassword("wrong", legacy)).toBe(false);
  });

  it("rejects malformed stored values instead of throwing", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "scrypt$15$8")).toBe(false);
    expect(await verifyPassword("x", "plaintext")).toBe(false);
  });
});

describe("needsRehash", () => {
  it("flags bcrypt and other scrypt parameters, not the current ones", async () => {
    expect(needsRehash(await bcrypt.hash("x", 10))).toBe(true);
    expect(needsRehash("scrypt$14$8$1$c2FsdA==$a2V5")).toBe(true);
    expect(needsRehash(await hashPassword("x"))).toBe(false);
  });
});

describe("passwordProblem", () => {
  it("enforces the length bounds", () => {
    expect(passwordProblem("x".repeat(PASSWORD_MIN_LENGTH - 1))).toMatch(/at least/);
    expect(passwordProblem("x".repeat(PASSWORD_MIN_LENGTH))).toBeNull();
    expect(passwordProblem("x".repeat(PASSWORD_MAX_LENGTH))).toBeNull();
    expect(passwordProblem("x".repeat(PASSWORD_MAX_LENGTH + 1))).toMatch(/or fewer/);
  });
});
