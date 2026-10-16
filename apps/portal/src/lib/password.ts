/**
 * Password hashing (Epic 28 F8). New hashes are scrypt with OWASP's
 * N=2^15, r=8, p=3 (32 MiB, about 140 ms in the container): memory-hard, no
 * input truncation, and in Node's standard library. Hashes made before
 * Epic 28 are bcrypt; they still verify, and signInAction re-hashes them on
 * the next successful sign-in.
 *
 * Format: scrypt$<log2 N>$<r>$<p>$<salt b64>$<key b64>. The parameters
 * travel with the hash, so they can be raised later without breaking old ones.
 */

import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "node:crypto";
import * as bcrypt from "bcrypt";

const PARAMS = { logN: 15, r: 8, p: 3 } as const;
const KEY_BYTES = 32;
const SALT_BYTES = 16;
const MAXMEM = 128 * 1024 * 1024;

function scrypt(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCallback(password, salt, KEY_BYTES, { ...options, maxmem: MAXMEM }, (err, key) =>
      err ? reject(err) : resolve(key)
    )
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const { logN, r, p } = PARAMS;
  const key = await scrypt(password, salt, { N: 2 ** logN, r, p });
  return ["scrypt", logN, r, p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith("$2")) {
    return bcrypt.compare(password, stored);
  }

  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, logN, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, "base64");
  const key = await scrypt(password, Buffer.from(saltB64, "base64"), {
    N: 2 ** Number(logN),
    r: Number(r),
    p: Number(p),
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** True for bcrypt hashes and scrypt hashes made with other parameters. */
export function needsRehash(stored: string): boolean {
  const { logN, r, p } = PARAMS;
  return !stored.startsWith(`scrypt$${logN}$${r}$${p}$`);
}
