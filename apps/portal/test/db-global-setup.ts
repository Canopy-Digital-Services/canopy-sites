import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import pg from "pg";
import { assertTestDatabase, testDatabaseUrl } from "./db-url";

/**
 * Creates the test database if it is missing and applies every migration with
 * `prisma migrate deploy`, the same command production runs at container
 * start. The plan and role catalogs come from the migrations themselves.
 */
export default async function setup() {
  const url = assertTestDatabase(testDatabaseUrl());
  const target = new URL(url);
  const name = decodeURIComponent(target.pathname.slice(1));

  const admin = new URL(url);
  admin.pathname = "/postgres";
  admin.search = "";
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
    if (!rowCount) await client.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`);
  } finally {
    await client.end();
  }

  const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");
  execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
}
