#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const options = {
  envFile: fs.existsSync(".env.staging") ? ".env.staging" : ".env.staging.example",
  apply: false,
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--env-file=")) options.envFile = arg.slice("--env-file=".length);
  if (arg === "--apply") options.apply = true;
}

loadEnvFile(options.envFile);

const validationArgs = ["scripts/validate-db-target.mjs", `--env-file=${options.envFile}`];
if (options.apply) validationArgs.push("--require-confirm");

const validation = spawnSync(process.execPath, validationArgs, {
  cwd: process.cwd(),
  env: process.env,
  encoding: "utf8",
  stdio: "inherit",
});

if (validation.status !== 0) {
  process.exit(validation.status ?? 1);
}

if (!options.apply) {
  console.log("");
  console.log("Dry-run only. To push schema to staging DB:");
  console.log("ALLOW_STAGING_SCHEMA_PUSH=true STAGING_DB_CONFIRM=autolab-staging npm run db:push:staging -- --env-file=.env.staging --apply");
  process.exit(0);
}

console.log("");
console.log("Applying Drizzle schema to staging DB...");
const push = spawnSync("npx", ["drizzle-kit", "push"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

process.exit(push.status ?? 1);

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
    const rawValue = trimmed.slice(index + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  }
}
