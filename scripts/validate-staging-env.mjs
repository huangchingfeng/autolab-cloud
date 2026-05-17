#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args = new Set(process.argv.slice(2));
const envPath = process.argv.find(arg => arg.startsWith("--env-file="))?.split("=")[1];
const strict = args.has("--strict");
const allowLiveKeys = args.has("--allow-live-keys");

if (envPath) {
  const absoluteEnvPath = path.resolve(envPath);
  if (!fs.existsSync(absoluteEnvPath)) {
    console.error(`Env file not found: ${absoluteEnvPath}`);
    process.exit(1);
  }

  const lines = fs.readFileSync(absoluteEnvPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
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

const required = [
  {
    key: "DATABASE_URL",
    label: "Neon/PostgreSQL connection string",
    validate: value => validateStagingDatabaseUrl(value).ok,
    hint: "Must be a non-placeholder PostgreSQL staging/dev/preview URL, not production, TiDB, MySQL, or Manus.",
  },
  {
    key: "CLERK_SECRET_KEY",
    label: "Clerk backend secret",
    validate: value => validateClerkKey(value, "sk_test_"),
    hint: "Expected Clerk staging/test secret key, usually sk_test_...",
  },
  {
    key: "CLERK_PUBLISHABLE_KEY",
    label: "Clerk backend publishable key",
    validate: value => validateClerkKey(value, "pk_test_"),
    hint: "Expected Clerk staging/test publishable key, usually pk_test_...",
  },
  {
    key: "VITE_CLERK_PUBLISHABLE_KEY",
    label: "Clerk frontend publishable key",
    validate: value => validateClerkKey(value, "pk_test_"),
    hint: "Must be a Clerk staging/test publishable key set at build time.",
  },
  {
    key: "JWT_SECRET",
    label: "Server JWT/session secret",
    validate: value => value.length >= 32 && !hasPlaceholder(value),
    hint: "Use a random value of at least 32 characters.",
  },
  {
    key: "ADMIN_USER_IDS",
    label: "Admin Clerk user ids",
    validate: value => value.split(",").some(item => item.trim().startsWith("user_")) && !hasPlaceholder(value),
    hint: "Comma-separated Clerk user IDs, for example user_xxx,user_yyy.",
  },
  {
    key: "TURNSTILE_SECRET_KEY",
    label: "Cloudflare Turnstile secret key",
    validate: value => value.startsWith("0x") && !hasPlaceholder(value),
    hint: "Needed by the contact form server verification.",
  },
  {
    key: "VITE_TURNSTILE_SITE_KEY",
    label: "Cloudflare Turnstile frontend site key",
    validate: value => value.startsWith("0x") && !hasPlaceholder(value),
    hint: "Needed at build time so the contact form can render Turnstile.",
  },
];

const recommended = [
  {
    key: "RESEND_API_KEY",
    label: "Email delivery",
    validate: value => value.startsWith("re_") && !hasPlaceholder(value),
    hint: "Needed for notification emails from registration/inquiry forms.",
  },
  {
    key: "EMAIL_FROM",
    label: "Email sender",
    validate: value => value.includes("@") && !hasPlaceholder(value),
    hint: "Use a verified sender domain in Resend.",
  },
  {
    key: "VITE_APP_URL",
    label: "Public staging URL",
    validate: value => /^https?:\/\//.test(value) && !value.includes("autolab.cloud") && !hasPlaceholder(value),
    hint: "For staging, use the preview URL, not the current production domain.",
  },
  {
    key: "R2_ACCOUNT_ID",
    label: "Cloudflare R2 account id",
    validate: value => value.length >= 8 && !hasPlaceholder(value),
    hint: "Needed for admin image uploads.",
  },
  {
    key: "R2_ACCESS_KEY_ID",
    label: "Cloudflare R2 access key",
    validate: value => value.length >= 8 && !hasPlaceholder(value),
    hint: "Needed for admin image uploads.",
  },
  {
    key: "R2_SECRET_ACCESS_KEY",
    label: "Cloudflare R2 secret key",
    validate: value => value.length >= 16 && !hasPlaceholder(value),
    hint: "Needed for admin image uploads.",
  },
  {
    key: "R2_BUCKET_NAME",
    label: "Cloudflare R2 bucket name",
    validate: value => value.length >= 3 && !hasPlaceholder(value),
    hint: "Use a staging bucket name, not the production bucket.",
  },
  {
    key: "R2_PUBLIC_URL",
    label: "Cloudflare R2 public URL",
    validate: value => /^https?:\/\//.test(value) && !hasPlaceholder(value),
    hint: "Needed so uploaded images have stable public URLs.",
  },
  {
    key: "VITE_GOOGLE_MAPS_API_KEY",
    label: "Google Maps frontend key",
    validate: value => value.length >= 12 && !hasPlaceholder(value),
    hint: "Needed for the map component; page still works without it but no map renders.",
  },
];

function mask(value) {
  if (!value) return "";
  if (value.length <= 12) return `${value.slice(0, 2)}...`;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
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

function validateStagingDatabaseUrl(value) {
  if (!value || hasPlaceholder(value)) return { ok: false };
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false };
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) return { ok: false };

  const full = value.toLowerCase();
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
  if (forbiddenTokens.some(token => full.includes(token))) return { ok: false };

  const stagingHints = ["staging", "stage", "preview", "test", "dev", "neon"];
  return { ok: stagingHints.some(token => full.includes(token)) };
}

function validateClerkKey(value, expectedPrefix) {
  if (!value || hasPlaceholder(value)) return false;
  if (allowLiveKeys) return value.startsWith(expectedPrefix.replace("_test_", "_")) || value.startsWith(expectedPrefix);
  return value.startsWith(expectedPrefix);
}

function check(item) {
  const value = process.env[item.key] ?? "";
  if (!value) {
    return { ...item, status: "missing", value };
  }
  if (!item.validate(value)) {
    return { ...item, status: "invalid", value };
  }
  return { ...item, status: "ok", value };
}

const requiredResults = required.map(check);
const recommendedResults = recommended.map(check);

const publishableKeysMatch =
  process.env.CLERK_PUBLISHABLE_KEY &&
  process.env.VITE_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_PUBLISHABLE_KEY === process.env.VITE_CLERK_PUBLISHABLE_KEY;

console.log("Autolab staging environment check");
console.log("=================================");
if (envPath) console.log(`Env file: ${path.resolve(envPath)}`);
console.log("");

for (const result of requiredResults) {
  const icon = result.status === "ok" ? "OK" : "!!";
  console.log(`${icon} ${result.key}: ${result.status}${result.value ? ` (${mask(result.value)})` : ""}`);
  if (result.status !== "ok") console.log(`   ${result.hint}`);
}

console.log("");
console.log("Recommended");
console.log("-----------");
for (const result of recommendedResults) {
  const icon = result.status === "ok" ? "OK" : "--";
  console.log(`${icon} ${result.key}: ${result.status}${result.value ? ` (${mask(result.value)})` : ""}`);
  if (result.status !== "ok") console.log(`   ${result.hint}`);
}

if (process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY) {
  console.log("");
  console.log(`Clerk publishable keys match: ${publishableKeysMatch ? "yes" : "no"}`);
}

const requiredFailures = requiredResults.filter(result => result.status !== "ok");
const recommendedFailures = recommendedResults.filter(result => result.status !== "ok");
const shouldFail = requiredFailures.length > 0 || (strict && recommendedFailures.length > 0);

if (shouldFail) {
  console.log("");
  console.error(
    strict
      ? "Staging env is not ready: required or recommended checks failed."
      : "Staging env is not ready: required checks failed."
  );
  process.exit(1);
}

console.log("");
console.log("Staging env is ready for schema push and preview deploy.");
