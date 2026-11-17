import { assertTestDatabase, testDatabaseUrl } from "./db-url";

// Runs in each worker before the test file's imports, so `@/lib/db` opens its
// pool against the test database and never the dev one.
process.env.DATABASE_URL = assertTestDatabase(testDatabaseUrl());

// The dev container holds a real Umami key; no test reaches the real Umami.
// A test that needs Umami stubs the env and fetch itself.
delete process.env.UMAMI_URL;
delete process.env.UMAMI_API_KEY;
