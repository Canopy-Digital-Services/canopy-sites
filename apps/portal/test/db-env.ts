import { assertTestDatabase, testDatabaseUrl } from "./db-url";

// Runs in each worker before the test file's imports, so `@/lib/db` opens its
// pool against the test database and never the dev one.
process.env.DATABASE_URL = assertTestDatabase(testDatabaseUrl());
