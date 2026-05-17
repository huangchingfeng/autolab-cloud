#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync, spawnSync } from "node:child_process";

const options = {
  envFile: fs.existsSync(".env.staging") ? ".env.staging" : ".env.staging.example",
  json: "",
  html: "",
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--env-file=")) options.envFile = arg.slice("--env-file=".length);
  if (arg.startsWith("--json=")) options.json = arg.slice("--json=".length);
  if (arg.startsWith("--html=")) options.html = arg.slice("--html=".length);
}

const repoRoot = process.cwd();
const env = readEnvFile(options.envFile);

const requiredEnv = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "VITE_CLERK_PUBLISHABLE_KEY",
  "JWT_SECRET",
  "ADMIN_USER_IDS",
  "TURNSTILE_SECRET_KEY",
  "VITE_TURNSTILE_SITE_KEY",
];

const recommendedEnv = [
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

const mirroredAssetPaths = [
  "client/public/downloads/taiwan-2026-ai-execution-system.pdf",
  "client/public/downloads/gemini-ai-strategy-guide.pdf",
  "client/public/downloads/notebooklm-8-tips-slides.pdf",
  "client/public/downloads/ai-crm-efficiency-revolution.pdf",
  "client/public/downloads/manus-ai-agent-summary.pdf",
  "client/public/downloads/manus-ai-system-overview.xlsx",
  "client/public/images/manus-event/content-alchemy.png",
  "client/public/images/notebooklm-course/notebooklm-2026-ai-upgrade.png",
  "client/public/course-videos/ai-tools-practice.mov",
];

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const renderYaml = fs.existsSync("render.yaml") ? fs.readFileSync("render.yaml", "utf8") : "";
const journal = fs.existsSync("drizzle/meta/_journal.json")
  ? JSON.parse(fs.readFileSync("drizzle/meta/_journal.json", "utf8"))
  : null;

const checks = [
  ...requiredEnv.map(key => envCheck(key, true)),
  ...recommendedEnv.map(key => envCheck(key, false)),
  scriptCheck("assets:mirror-cloudfront"),
  scriptCheck("assets:check-static"),
  scriptCheck("staging:smoke"),
  scriptCheck("staging:readiness"),
  scriptCheck("staging:preflight"),
  scriptCheck("staging:init-env"),
  scriptCheck("staging:check-sensitive-files"),
  scriptCheck("staging:check-git-deploy-files"),
  scriptCheck("staging:check-render-env"),
  scriptCheck("staging:check-db-target"),
  scriptCheck("staging:seed-sample-data"),
  scriptCheck("db:push:staging"),
  renderCheck("Render mirrors assets before build", renderYaml.includes("npm run assets:mirror-cloudfront") && renderYaml.includes("npm run assets:check-static")),
  renderCheck("Render has health check", renderYaml.includes("healthCheckPath: /api/health")),
  staticAssetCheck(),
  ignoredAssetsCheck(),
  sensitiveFileGuardCheck(),
  noRuntimeDomainCheck("No files.manuscdn.com runtime references", "files.manuscdn.com"),
  noRuntimeDomainCheck("No CloudFront runtime references", "d2xsxph8kpxj0f.cloudfront.net"),
  drizzleDialectCheck(),
];

const report = {
  generatedAt: new Date().toISOString(),
  repoRoot,
  envFile: path.resolve(options.envFile),
  gitBranch: tryCommand("git", ["branch", "--show-current"]).trim(),
  gitStatus: tryCommand("git", ["status", "--short", "--untracked-files=no"]).trim().split("\n").filter(Boolean),
  checks,
  summary: {
    pass: checks.filter(check => check.status === "pass").length,
    warn: checks.filter(check => check.status === "warn").length,
    fail: checks.filter(check => check.status === "fail").length,
  },
};

writeFile(options.json, `${JSON.stringify(report, null, 2)}\n`);
writeFile(options.html, renderHtml(report));

console.log(`Readiness: ${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail`);
if (options.html) console.log(`Wrote ${path.resolve(options.html)}`);
if (options.json) console.log(`Wrote ${path.resolve(options.json)}`);

if (report.summary.fail > 0) {
  process.exit(1);
}

function readEnvFile(file) {
  const absolute = path.resolve(file);
  const result = {};
  if (!fs.existsSync(absolute)) return result;

  for (const line of fs.readFileSync(absolute, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    result[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return result;
}

function hasPlaceholder(value = "") {
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

function envCheck(key, required) {
  const value = env[key] ?? process.env[key] ?? "";
  const ok = validateEnvValue(key, value);
  return {
    name: `${required ? "Required" : "Recommended"} env: ${key}`,
    status: ok ? "pass" : required ? "fail" : "warn",
    detail: ok ? "Configured" : required ? "Missing, placeholder, or unsafe staging value" : "Missing, placeholder, or unsafe staging value",
  };
}

function validateEnvValue(key, value) {
  if (!value || hasPlaceholder(value)) return false;
  if (key === "DATABASE_URL") return validateStagingDatabaseUrl(value);
  if (["CLERK_SECRET_KEY"].includes(key)) return value.startsWith("sk_test_");
  if (["CLERK_PUBLISHABLE_KEY", "VITE_CLERK_PUBLISHABLE_KEY"].includes(key)) return value.startsWith("pk_test_");
  if (key === "VITE_APP_URL") return /^https?:\/\//.test(value) && !value.includes("autolab.cloud");
  return true;
}

function validateStagingDatabaseUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) return false;
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
  if (forbiddenTokens.some(token => full.includes(token))) return false;
  return ["staging", "stage", "preview", "test", "dev", "neon"].some(token => full.includes(token));
}

function scriptCheck(name) {
  const ok = Boolean(packageJson.scripts?.[name]);
  return {
    name: `Package script: ${name}`,
    status: ok ? "pass" : "fail",
    detail: ok ? packageJson.scripts[name] : "Missing script",
  };
}

function renderCheck(name, ok) {
  return {
    name,
    status: ok ? "pass" : "fail",
    detail: ok ? "Configured" : "Missing from render.yaml",
  };
}

function staticAssetCheck() {
  const missing = mirroredAssetPaths.filter(item => !fs.existsSync(path.resolve(item)));
  const bytes = mirroredAssetPaths
    .filter(item => fs.existsSync(path.resolve(item)))
    .reduce((sum, item) => sum + fs.statSync(path.resolve(item)).size, 0);

  return {
    name: "Mirrored static assets present locally",
    status: missing.length === 0 ? "pass" : "warn",
    detail: missing.length === 0
      ? `${mirroredAssetPaths.length} sample assets present (${bytes} bytes)`
      : `Missing ${missing.length} sample assets; run npm run assets:mirror-cloudfront`,
  };
}

function ignoredAssetsCheck() {
  const ignoredSet = getGitIgnored(mirroredAssetPaths);
  const ignored = mirroredAssetPaths.filter(item => ignoredSet.has(item));
  return {
    name: "Large mirrored assets are gitignored",
    status: ignored.length === mirroredAssetPaths.length ? "pass" : "warn",
    detail: `${ignored.length}/${mirroredAssetPaths.length} sample mirrored assets ignored`,
  };
}

function sensitiveFileGuardCheck() {
  const riskySamples = [
    ".env",
    ".env.staging",
    "_imports/manus-production-dump/autolab.sql.gz",
    "_reports/autolab-staging-readiness.json",
    "manus-production-dump/autolab.dump",
    "db-dumps/autolab.pgdump",
  ];
  const ignoredSet = getGitIgnored(riskySamples);
  const ignored = riskySamples.filter(item => ignoredSet.has(item));
  return {
    name: "Private migration data and env files are gitignored",
    status: ignored.length === riskySamples.length ? "pass" : "fail",
    detail: `${ignored.length}/${riskySamples.length} sensitive sample paths ignored`,
  };
}

function noRuntimeDomainCheck(name, domain) {
  const matches = scanTextFiles(["client/src", "server", "render.yaml"], domain);
  return {
    name,
    status: matches.length === 0 ? "pass" : "fail",
    detail: matches.length === 0 ? "No runtime references found" : matches.slice(0, 5).join(", "),
  };
}

function drizzleDialectCheck() {
  if (!journal) {
    return { name: "Drizzle migration journal", status: "warn", detail: "No journal found" };
  }
  if (journal.dialect === "postgresql") {
    return { name: "Drizzle migration journal dialect", status: "pass", detail: "PostgreSQL" };
  }
  return {
    name: "Drizzle migration journal dialect",
    status: "warn",
    detail: `Existing journal dialect is ${journal.dialect}; use db:push only on clean staging until migration history is normalized.`,
  };
}

function scanTextFiles(roots, pattern) {
  const matches = [];
  for (const file of roots.flatMap(walk).sort()) {
    const text = readText(file);
    if (!text || !text.includes(pattern)) continue;
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index].includes(pattern)) matches.push(`${path.relative(repoRoot, file)}:${index + 1}`);
    }
  }
  return matches;
}

function walk(target) {
  const absolute = path.resolve(repoRoot, target);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [absolute];
  if (!stat.isDirectory()) return [];

  const files = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
    const child = path.join(absolute, entry.name);
    if (entry.isDirectory()) files.push(...walk(path.relative(repoRoot, child)));
    if (entry.isFile()) files.push(child);
  }
  return files;
}

function readText(file) {
  const stat = fs.statSync(file);
  if (stat.size > 2_000_000) return "";
  const buffer = fs.readFileSync(file);
  if (buffer.includes(0)) return "";
  return buffer.toString("utf8");
}

function getGitIgnored(files) {
  const result = spawnSync("git", ["check-ignore", "--stdin"], {
    cwd: repoRoot,
    input: `${files.join("\n")}\n`,
    encoding: "utf8",
    timeout: 5000,
  });

  if (result.error) return new Set(files.filter(matchesProjectIgnore));
  return new Set((result.stdout || "").trim().split(/\r?\n/).filter(Boolean));
}

function matchesProjectIgnore(file) {
  const gitignorePath = path.resolve(repoRoot, ".gitignore");
  if (!fs.existsSync(gitignorePath)) return false;

  const patterns = fs.readFileSync(gitignorePath, "utf8")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#") && !line.startsWith("!"));

  return patterns.some(pattern => matchesIgnorePattern(file, pattern));
}

function matchesIgnorePattern(file, pattern) {
  const normalizedFile = file.replaceAll("\\", "/");
  const normalizedPattern = pattern.replaceAll("\\", "/");
  const basename = path.posix.basename(normalizedFile);

  if (normalizedPattern.endsWith("/")) {
    const directory = normalizedPattern.slice(0, -1);
    return normalizedFile === directory || normalizedFile.startsWith(`${directory}/`);
  }

  if (normalizedPattern.startsWith("**/")) {
    return matchesIgnorePattern(normalizedFile, normalizedPattern.slice(3))
      || normalizedFile.includes(`/${normalizedPattern.slice(3)}`);
  }

  if (normalizedPattern.startsWith("*.")) {
    return basename.endsWith(normalizedPattern.slice(1));
  }

  if (normalizedPattern.startsWith("*")) {
    return basename.endsWith(normalizedPattern.slice(1));
  }

  if (normalizedPattern.includes("/")) {
    return normalizedFile === normalizedPattern;
  }

  return basename === normalizedPattern || normalizedFile.startsWith(`${normalizedPattern}/`);
}

function tryCommand(command, args) {
  try {
    return execFileSync(command, args, { cwd: repoRoot, encoding: "utf8", timeout: 5000 });
  } catch {
    return "";
  }
}

function writeFile(target, contents) {
  if (!target) return;
  const absolute = path.resolve(target);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, contents);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtml(data) {
  const rows = data.checks
    .map(check => `
      <tr>
        <td><span class="badge ${check.status}">${escapeHtml(check.status.toUpperCase())}</span></td>
        <td>${escapeHtml(check.name)}</td>
        <td>${escapeHtml(check.detail)}</td>
      </tr>`)
    .join("");

  const statusRows = data.gitStatus.length > 0
    ? data.gitStatus.map(item => `<li><code>${escapeHtml(item)}</code></li>`).join("")
    : "<li>No local changes</li>";

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autolab Staging Readiness</title>
  <style>
    body { margin: 0; background: #f7f8fb; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; }
    main { max-width: 1120px; margin: 0 auto; padding: 40px 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    h2 { margin-top: 28px; font-size: 20px; }
    .meta { color: #647085; }
    .summary { display: flex; gap: 12px; margin: 22px 0; flex-wrap: wrap; }
    .card { background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; padding: 14px 16px; min-width: 120px; }
    .num { display: block; font-size: 26px; font-weight: 800; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e8edf5; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef2f8; font-weight: 700; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .badge { display: inline-flex; border-radius: 999px; padding: 3px 8px; font-weight: 700; font-size: 12px; }
    .pass { background: #dcfce7; color: #166534; }
    .warn { background: #fef3c7; color: #92400e; }
    .fail { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <main>
    <h1>Autolab Staging Readiness</h1>
    <p class="meta">Generated at ${escapeHtml(data.generatedAt)} · branch <code>${escapeHtml(data.gitBranch || "(unknown)")}</code> · env file <code>${escapeHtml(data.envFile)}</code></p>
    <div class="summary">
      <div class="card"><span class="num">${data.summary.pass}</span>Pass</div>
      <div class="card"><span class="num">${data.summary.warn}</span>Warn</div>
      <div class="card"><span class="num">${data.summary.fail}</span>Fail</div>
    </div>
    <h2>Checks</h2>
    <table>
      <thead><tr><th>Status</th><th>Check</th><th>Detail</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <h2>Git Status</h2>
    <ul>${statusRows}</ul>
  </main>
</body>
</html>`;
}
