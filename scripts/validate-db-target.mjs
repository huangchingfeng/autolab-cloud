#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const options = {
  envFile: fs.existsSync(".env.staging") ? ".env.staging" : ".env.staging.example",
  requireConfirm: false,
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--env-file=")) options.envFile = arg.slice("--env-file=".length);
  if (arg === "--require-confirm") options.requireConfirm = true;
}

loadEnvFile(options.envFile);

const databaseUrl = process.env.DATABASE_URL || "";
const failures = [];
const warnings = [];

if (!databaseUrl) {
  failures.push("DATABASE_URL is missing.");
} else if (hasPlaceholder(databaseUrl)) {
  failures.push("DATABASE_URL contains placeholder text.");
} else {
  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    failures.push("DATABASE_URL is not a valid URL.");
  }

  if (parsed) {
    if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
      failures.push(`DATABASE_URL must use PostgreSQL protocol, got ${parsed.protocol}.`);
    }

    const full = databaseUrl.toLowerCase();
    const forbiddenTokens = [
      "mysql",
      "tidb",
      "planetscale",
      "production",
      "prod-",
      "-prod",
      "autolab.cloud",
      "www.autolab.cloud",
      "manus",
    ];
    const matchedForbidden = forbiddenTokens.filter(token => full.includes(token));
    if (matchedForbidden.length > 0) {
      failures.push(`DATABASE_URL contains production/unsupported token(s): ${matchedForbidden.join(", ")}.`);
    }

    const stagingHints = ["staging", "stage", "preview", "test", "dev", "neon"];
    if (!stagingHints.some(token => full.includes(token))) {
      warnings.push("DATABASE_URL does not contain a staging/dev/preview hint. Verify this is not production before writing.");
    }

    if (parsed.username && parsed.username.toLowerCase().includes("root")) {
      warnings.push("DATABASE_URL username looks highly privileged. Prefer a staging-scoped user.");
    }
  }
}

if (options.requireConfirm) {
  if (process.env.ALLOW_STAGING_SCHEMA_PUSH !== "true") {
    failures.push("ALLOW_STAGING_SCHEMA_PUSH=true is required for schema writes.");
  }
  if (process.env.STAGING_DB_CONFIRM !== "autolab-staging") {
    failures.push("STAGING_DB_CONFIRM=autolab-staging is required for schema writes.");
  }
}

console.log("Autolab staging DB target check");
console.log("===============================");
console.log(`Env file: ${path.resolve(options.envFile)}`);
console.log(`DATABASE_URL: ${maskDatabaseUrl(databaseUrl) || "(missing)"}`);
console.log("");

for (const warning of warnings) {
  console.log(`WARN ${warning}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL ${failure}`);
  }
  process.exit(1);
}

console.log("OK staging DB target passed safety checks.");

function loadEnvFile(file) {
  const absolute = path.resolve(file);
  if (!fs.existsSync(absolute)) return;

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

function maskDatabaseUrl(value) {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    if (parsed.password) parsed.password = "****";
    if (parsed.username) parsed.username = `${parsed.username.slice(0, 3)}...`;
    return parsed.toString();
  } catch {
    return value.slice(0, 18) + "...";
  }
}

function hasPlaceholder(value) {
  const normalized = value.toLowerCase();
  return [
    "xxxxx",
    "example.com",
    "example",
    "username",
    "password",
    "replace_with",
    "your_",
    "your-",
    "your.",
  ].some(token => normalized.includes(token));
}
