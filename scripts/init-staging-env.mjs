#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const options = {
  exampleFile: ".env.staging.example",
  targetFile: ".env.staging",
  write: false,
  force: false,
  appUrl: "",
  json: "",
  html: "",
};

for (const arg of process.argv.slice(2)) {
  if (arg === "--write") options.write = true;
  if (arg === "--force") options.force = true;
  if (arg.startsWith("--example-file=")) options.exampleFile = arg.slice("--example-file=".length);
  if (arg.startsWith("--target-file=")) options.targetFile = arg.slice("--target-file=".length);
  if (arg.startsWith("--app-url=")) options.appUrl = arg.slice("--app-url=".length);
  if (arg.startsWith("--json=")) options.json = arg.slice("--json=".length);
  if (arg.startsWith("--html=")) options.html = arg.slice("--html=".length);
}

const examplePath = path.resolve(options.exampleFile);
const targetPath = path.resolve(options.targetFile);

if (!fs.existsSync(examplePath)) {
  console.error(`Example env file not found: ${examplePath}`);
  process.exit(1);
}

const targetExists = fs.existsSync(targetPath);
if (options.write && targetExists && !options.force) {
  console.error(`Refusing to overwrite existing env file: ${targetPath}`);
  console.error("Use --force only after backing up the current file.");
  process.exit(1);
}

const generatedJwtSecret = crypto.randomBytes(48).toString("base64url");
const rendered = renderEnv(fs.readFileSync(examplePath, "utf8"), {
  JWT_SECRET: generatedJwtSecret,
  VITE_APP_URL: options.appUrl || "https://YOUR-RENDER-PREVIEW.onrender.com",
});

const env = parseEnv(rendered);
const requiredKeys = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "VITE_CLERK_PUBLISHABLE_KEY",
  "JWT_SECRET",
  "ADMIN_USER_IDS",
  "TURNSTILE_SECRET_KEY",
  "VITE_TURNSTILE_SITE_KEY",
];
const recommendedKeys = [
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "VITE_APP_URL",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
  "VITE_GOOGLE_MAPS_API_KEY",
];
const optionalKeys = [
  "GEMINI_API_KEY",
  "NEWEBPAY_MERCHANT_ID",
  "NEWEBPAY_HASH_KEY",
  "NEWEBPAY_HASH_IV",
  "NEWEBPAY_API_URL",
  "MAKE_WEBHOOK_URL",
  "ACCOUNTING_WEBHOOK_URL",
  "ACCOUNTING_WEBHOOK_ENABLED",
  "VITE_ANALYTICS_ENDPOINT",
  "VITE_ANALYTICS_WEBSITE_ID",
];

const checks = [
  ...requiredKeys.map(key => envCheck(key, "required", env[key])),
  ...recommendedKeys.map(key => envCheck(key, "recommended", env[key])),
  ...optionalKeys.map(key => envCheck(key, "optional", env[key])),
];

const report = {
  generatedAt: new Date().toISOString(),
  mode: options.write ? "write" : "dry-run",
  exampleFile: examplePath,
  targetFile: targetPath,
  targetExists,
  wroteFile: false,
  appUrl: env.VITE_APP_URL || "",
  checks,
  summary: {
    readyRequired: checks.filter(check => check.group === "required" && check.status === "ready").length,
    required: requiredKeys.length,
    missingRequired: checks.filter(check => check.group === "required" && check.status !== "ready").map(check => check.key),
    missingRecommended: checks.filter(check => check.group === "recommended" && check.status !== "ready").map(check => check.key),
  },
};

if (options.write) {
  fs.writeFileSync(targetPath, rendered, { mode: 0o600 });
  report.wroteFile = true;
}

const redactedReport = redactReport(report);
writeFile(options.json, `${JSON.stringify(redactedReport, null, 2)}\n`);
writeFile(options.html, renderHtml(redactedReport));

console.log("Autolab staging env bootstrap");
console.log("=============================");
console.log(`Mode: ${report.mode}`);
console.log(`Target: ${targetPath}`);
console.log(`Target existed: ${targetExists ? "yes" : "no"}`);
console.log(`Wrote file: ${report.wroteFile ? "yes" : "no"}`);
console.log(`Required ready: ${report.summary.readyRequired}/${report.summary.required}`);
if (report.summary.missingRequired.length > 0) {
  console.log(`Missing required: ${report.summary.missingRequired.join(", ")}`);
}
if (!options.write) console.log("Dry-run only. Add --write to create .env.staging.");
if (options.html) console.log(`Wrote ${path.resolve(options.html)}`);
if (options.json) console.log(`Wrote ${path.resolve(options.json)}`);

function renderEnv(text, replacements) {
  return text
    .split(/\r?\n/)
    .map(line => {
      const index = line.indexOf("=");
      if (index === -1 || line.trim().startsWith("#")) return line;
      const key = line.slice(0, index).trim();
      if (Object.prototype.hasOwnProperty.call(replacements, key)) return `${key}=${replacements[key]}`;
      return line;
    })
    .join("\n")
    .replace(/\n?$/, "\n");
}

function parseEnv(text) {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    env[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return env;
}

function hasPlaceholder(value = "") {
  const normalized = value.toLowerCase();
  return ["xxxxx", "example.com", "example", "username", "password", "replace_with", "your_", "your-", "your."].some(token => normalized.includes(token));
}

function envCheck(key, group, value = "") {
  const ready = Boolean(value) && !hasPlaceholder(value);
  return { key, group, status: ready ? "ready" : "needs-value", value };
}

function mask(value = "") {
  if (!value) return "";
  if (hasPlaceholder(value)) return "(placeholder)";
  if (value.length <= 12) return `${value.slice(0, 2)}...`;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function redactReport(data) {
  return {
    ...data,
    checks: data.checks.map(check => ({ ...check, value: mask(check.value) })),
  };
}

function writeFile(target, contents) {
  if (!target) return;
  const absolute = path.resolve(target);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, contents);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderHtml(data) {
  const rows = data.checks
    .map(check => `
      <tr>
        <td><code>${escapeHtml(check.key)}</code></td>
        <td>${escapeHtml(check.group)}</td>
        <td>${escapeHtml(check.status)}</td>
        <td>${escapeHtml(check.value)}</td>
      </tr>`)
    .join("");

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autolab Staging Env Bootstrap</title>
  <style>
    body { margin: 0; background: #f7f8fb; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; line-height: 1.65; }
    main { max-width: 1080px; margin: 0 auto; padding: 44px 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    .lead { color: #647085; }
    .notice { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 16px; margin: 22px 0; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e8edf5; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef2f8; font-weight: 700; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  </style>
</head>
<body>
  <main>
    <h1>Autolab Staging Env Bootstrap</h1>
    <p class="lead">Generated at ${escapeHtml(data.generatedAt)} · mode <code>${escapeHtml(data.mode)}</code></p>
    <div class="notice">
      Target: <code>${escapeHtml(data.targetFile)}</code><br />
      Wrote file: ${data.wroteFile ? "yes" : "no"}<br />
      Required ready: ${data.summary.readyRequired}/${data.summary.required}
    </div>
    <table>
      <thead><tr><th>Key</th><th>Group</th><th>Status</th><th>Value</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
</body>
</html>
`;
}
