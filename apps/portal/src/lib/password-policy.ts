/**
 * Password rules shared by the server actions and the forms. No Node imports:
 * client components use this module. Hashing lives in `password.ts`.
 */

export const PASSWORD_MIN_LENGTH = 8;
/** NIST SP 800-63B asks verifiers to accept at least 64 characters. */
export const PASSWORD_MAX_LENGTH = 128;

/** The reason a new password is unacceptable, or null. Shared by signup, reset, and change. */
export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer`;
  }
  return null;
}
