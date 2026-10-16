/**
 * The database the `db` test project uses: TEST_DATABASE_URL if set, else
 * DATABASE_URL with its database renamed to `canopy_test`. Returns undefined
 * when neither is set, and global setup then refuses to run.
 */
export function testDatabaseUrl(): string | undefined {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  if (!process.env.DATABASE_URL) return undefined;
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = "/canopy_test";
  return url.toString();
}

/**
 * Tests truncate every table, so they must never point at a real database.
 * Anything whose name does not end in `_test` is refused.
 */
export function assertTestDatabase(url: string | undefined): string {
  if (!url) {
    throw new Error("No test database: set TEST_DATABASE_URL or DATABASE_URL.");
  }
  const name = decodeURIComponent(new URL(url).pathname.slice(1));
  if (!name.endsWith("_test")) {
    throw new Error(`Refusing to run database tests against "${name}": the name must end in _test.`);
  }
  return url;
}
