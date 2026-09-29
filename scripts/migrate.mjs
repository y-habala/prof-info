#!/usr/bin/env node
// Minimal migration runner: applies supabase/migrations/*.sql, in order, once
// each, tracked in a `_migrations` table. Used because the Supabase CLI isn't
// available in this environment; a real `supabase db push` can take over
// later (see README).
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Client } from "pg";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadEnvLocal() {
  let content;
  try {
    content = readFileSync(path.join(root, ".env.local"), "utf8");
  } catch {
    return;
  }
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error(
    "Missing SUPABASE_DB_URL in .env.local\n" +
      "(Supabase Dashboard -> Project Settings -> Database -> Connection string -> URI, with the password filled in)"
  );
  process.exit(1);
}

const migrationsDir = path.join(root, "supabase", "migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  await client.query(`
    create table if not exists _migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const { rows } = await client.query("select filename from _migrations");
  const applied = new Set(rows.map((r) => r.filename));

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip  ${file} (already applied)`);
      continue;
    }
    const sql = readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`apply ${file}`);
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into _migrations (filename) values ($1)", [file]);
      await client.query("commit");
      console.log("  ok");
    } catch (err) {
      await client.query("rollback");
      console.error(`  FAILED: ${err.message}`);
      process.exitCode = 1;
      break;
    }
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
