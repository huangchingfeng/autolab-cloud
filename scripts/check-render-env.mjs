#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const options = {
  envFile: ".env.staging.example",
  renderFile: "render.yaml",
  json: "",
  html: "",
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--env-file=")) options.envFile = arg.slice("--env-file=".length);
  if (arg.startsWith("--render-file=")) options.renderFile = arg.slice("--render-file=".length);
  if (arg.startsWith("--json=")) options.json = arg.slice("--json=".length);
  if (arg.startsWith("--html=")) options.html = arg.slice("--html=".length);
}

const ignoredEnvKeys = new Set([
  "ALLOW_STAGING_SCHEMA_PUSH",
  "STAGING_DB_CONFIRM",
  "NODE_ENV",
  "VITE_APP_TITLE",
]);

const envPath = path.resolve(options.envFile);
const renderPath = path.resolve(options.renderFile);

if (!fs.existsSync(envPath)) {
  console.error(`Env file not found: ${envPath}`);
  process.exit(1);
}
if (!fs.existsSync(renderPath)) {
  console.error(`Render file not found: ${renderPath}`);
  process.exit(1);
}

const envKeys = readEnvKeys(envPath).filter(key => !ignoredEnvKeys.has(key));
const renderText = fs.readFileSync(renderPath, "utf8");
const renderKeys = [...renderText.matchAll(/^\s*-\s+key:\s+([A-Z0-9_]+)/gm)].map(match => match[1]);
const renderKeySet = new Set(renderKeys);

const missingInRender = envKeys.filter(key => !renderKeySet.has(key));
const extraInRender = renderKeys.filter(key => !envKeys.includes(key) && !ignoredEnvKeys.has(key) && key !== "NODE_ENV");
const duplicateRenderKeys = renderKeys.filter((key, index) => renderKeys.indexOf(key) !== index);

const report = {
  generatedAt: new Date().toISOString(),
  envFile: envPath,
  renderFile: renderPath,
  ignoredEnvKeys: [...ignoredEnvKeys],
  summary: {
    envKeys: envKeys.length,
    renderKeys: renderKeys.length,
    missingInRender: missingInRender.length,
    extraInRender: extraInRender.length,
    duplicateRenderKeys: duplicateRenderKeys.length,
  },
  envKeys,
  renderKeys,
  missingInRender,
  extraInRender,
  duplicateRenderKeys,
};

writeFile(options.json, `${JSON.stringify(report, null, 2)}\n`);
writeFile(options.html, renderHtml(report));

console.log("Autolab Render env check");
console.log("========================");
console.log(`Env keys checked: ${report.summary.envKeys}`);
console.log(`Render keys found: ${report.summary.renderKeys}`);
console.log(`Missing in render: ${report.summary.missingInRender}`);
console.log(`Extra in render: ${report.summary.extraInRender}`);
console.log(`Duplicate render keys: ${report.summary.duplicateRenderKeys}`);
if (options.html) console.log(`Wrote ${path.resolve(options.html)}`);
if (options.json) console.log(`Wrote ${path.resolve(options.json)}`);

if (missingInRender.length > 0 || duplicateRenderKeys.length > 0) {
  for (const key of missingInRender) console.error(`Missing in render.yaml: ${key}`);
  for (const key of duplicateRenderKeys) console.error(`Duplicate in render.yaml: ${key}`);
  process.exit(1);
}

function readEnvKeys(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#") && line.includes("="))
    .map(line => line.slice(0, line.indexOf("=")).trim());
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
  const missingRows = data.missingInRender.length
    ? data.missingInRender.map(key => `<tr><td><code>${escapeHtml(key)}</code></td></tr>`).join("\n        ")
    : `<tr><td>No missing Render env keys.</td></tr>`;
  const extraRows = data.extraInRender.length
    ? data.extraInRender.map(key => `<tr><td><code>${escapeHtml(key)}</code></td></tr>`).join("\n        ")
    : `<tr><td>No unexpected Render env keys.</td></tr>`;

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autolab Render Env Check</title>
  <style>
    body { margin: 0; background: #f7f8fb; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; line-height: 1.65; }
    main { max-width: 960px; margin: 0 auto; padding: 44px 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    h2 { margin-top: 32px; padding-top: 18px; border-top: 1px solid #dce4f0; font-size: 20px; }
    .lead { color: #647085; }
    .notice { background: #ecfdf5; border: 1px solid #bbf7d0; color: #166534; border-radius: 8px; padding: 14px 16px; margin: 22px 0; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e8edf5; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef2f8; font-weight: 700; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  </style>
</head>
<body>
  <main>
    <h1>Autolab Render Env Check</h1>
    <p class="lead">Generated at ${escapeHtml(data.generatedAt)}</p>
    <div class="notice">Missing in Render: ${data.summary.missingInRender}; duplicate Render keys: ${data.summary.duplicateRenderKeys}.</div>

    <h2>Missing In Render</h2>
    <table><tbody>${missingRows}</tbody></table>

    <h2>Extra In Render</h2>
    <table><tbody>${extraRows}</tbody></table>
  </main>
</body>
</html>
`;
}
