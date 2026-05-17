#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import postgres from "postgres";

const options = {
  apply: false,
  envFile: fs.existsSync(".env.staging") ? ".env.staging" : "",
  skipEnvFile: false,
};

for (const arg of process.argv.slice(2)) {
  if (arg === "--apply") options.apply = true;
  if (arg === "--no-env-file") options.skipEnvFile = true;
  if (arg.startsWith("--env-file=")) options.envFile = arg.slice("--env-file=".length);
}

if (!options.skipEnvFile && options.envFile) loadEnvFile(options.envFile);

console.log("Autolab scheduled blog publisher");
console.log("================================");
console.log(`Mode: ${options.apply ? "apply" : "dry-run"}`);
if (options.skipEnvFile) {
  console.log("Env file: skipped");
} else if (options.envFile) {
  console.log(`Env file: ${path.resolve(options.envFile)}`);
}
console.log("");

const databaseUrl = process.env.DATABASE_URL || "";
if (!databaseUrl) {
  console.log("DATABASE_URL is not set. Nothing was checked.");
  process.exit(options.apply ? 1 : 0);
}

validateDatabaseUrl(databaseUrl);
if (options.apply) validateWriteGuards();

const db = postgres(databaseUrl, { max: 1 });

try {
  const rows = options.apply ? await publishDuePosts(db) : await listDuePosts(db);
  if (rows.length === 0) {
    console.log("No scheduled posts are due.");
  } else {
    for (const row of rows) {
      console.log(`${row.id}\t${row.slug}\t${formatDate(row.publishedAt)}\t${row.title}`);
    }
  }

  if (!options.apply) {
    console.log("");
    console.log("Dry-run only. To publish due posts:");
    console.log("ALLOW_BLOG_SCHEDULER_WRITE=true BLOG_SCHEDULER_CONFIRM=autolab-staging npm run blog:publish-scheduled -- --apply");
  }
} finally {
  await db.end();
}

async function listDuePosts(db) {
  return await db`
    SELECT "id", "title", "slug", "publishedAt"
    FROM "posts"
    WHERE "status" = 'draft'
      AND "publishedAt" IS NOT NULL
      AND "publishedAt" <= now()
    ORDER BY "publishedAt" ASC
  `;
}

async function publishDuePosts(db) {
  return await db`
    UPDATE "posts"
    SET "status" = 'published',
        "updatedAt" = now()
    WHERE "status" = 'draft'
      AND "publishedAt" IS NOT NULL
      AND "publishedAt" <= now()
    RETURNING "id", "title", "slug", "publishedAt"
  `;
}

function loadEnvFile(file) {
  const absolute = path.resolve(file);
  if (!fs.existsSync(absolute)) {
    console.error(`Env file not found: ${absolute}`);
    process.exit(1);
  }

  for (const line of fs.readFileSync(absolute, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

function validateWriteGuards() {
  if (process.env.ALLOW_BLOG_SCHEDULER_WRITE !== "true" || process.env.BLOG_SCHEDULER_CONFIRM !== "autolab-staging") {
    console.error("Refusing to write. Set ALLOW_BLOG_SCHEDULER_WRITE=true and BLOG_SCHEDULER_CONFIRM=autolab-staging.");
    process.exit(1);
  }
}

function validateDatabaseUrl(databaseUrl) {
  if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    console.error("DATABASE_URL must be PostgreSQL.");
    process.exit(1);
  }

  if (options.apply && /tidbcloud|mysql|manus|production|prod/i.test(databaseUrl)) {
    console.error("Refusing to write to a production, Manus, TiDB, MySQL, or prod-looking DATABASE_URL.");
    process.exit(1);
  }
}

function formatDate(value) {
  if (!value) return "";
  return value instanceof Date ? value.toISOString() : String(value);
}
