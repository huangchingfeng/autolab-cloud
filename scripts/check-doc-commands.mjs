#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const options = {
  json: "/Users/huangjingfeng/Desktop/專案/_reports/autolab-doc-command-check.json",
  html: "/Users/huangjingfeng/Desktop/專案/_reports/autolab-doc-command-check.html",
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--json=")) options.json = arg.slice("--json=".length);
  if (arg.startsWith("--html=")) options.html = arg.slice("--html=".length);
}

const repoRoot = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const packageScripts = packageJson.scripts ?? {};
const scanRoots = [
  "docs",
  "README.md",
  "CLAUDE.md",
  "scripts",
  "render.yaml",
];

const files = scanRoots.flatMap(root => collectFiles(path.join(repoRoot, root)));
const references = [];

for (const file of files) {
  const relativeFile = path.relative(repoRoot, file);
  const contents = fs.readFileSync(file, "utf8");
  const lines = contents.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const reference of extractCommandReferences(line)) {
      references.push({
        file: relativeFile,
        line: index + 1,
        command: reference.command,
        script: reference.script,
        exists: Boolean(packageScripts[reference.script]),
      });
    }
  }
}

const missing = references.filter(reference => !reference.exists);
const report = {
  generatedAt: new Date().toISOString(),
  repoRoot,
  scannedFiles: files.length,
  referencedCommands: references.length,
  summary: {
    checked: references.length,
    existing: references.filter(reference => reference.exists).length,
    missing: missing.length,
  },
  missing,
  references,
};

writeFile(options.json, `${JSON.stringify(report, null, 2)}\n`);
writeFile(options.html, renderHtml(report));

console.log("Autolab doc command check");
console.log("=========================");
console.log(`Scanned files: ${report.scannedFiles}`);
console.log(`Referenced package scripts: ${report.summary.checked}`);
console.log(`Missing scripts: ${report.summary.missing}`);
console.log(`Wrote ${path.resolve(options.html)}`);
console.log(`Wrote ${path.resolve(options.json)}`);

if (missing.length > 0) {
  for (const reference of missing) {
    console.error(`Missing package script "${reference.script}" referenced by ${reference.file}:${reference.line}`);
  }
  process.exit(1);
}

function collectFiles(target) {
  if (!fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return shouldScan(target) ? [target] : [];
  if (!stat.isDirectory()) return [];

  const result = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    result.push(...collectFiles(path.join(target, entry.name)));
  }
  return result.sort();
}

function shouldScan(file) {
  const lower = file.toLowerCase();
  return [".html", ".md", ".mjs", ".js", ".json", ".yaml", ".yml"].some(ext => lower.endsWith(ext));
}

function extractCommandReferences(line) {
  const references = [];
  const runRegex = /\b(?:npm|pnpm|yarn)\s+run\s+([A-Za-z0-9:_-]+)/g;
  const directRegex = /\b(?:npm|pnpm|yarn)\s+(test|start)\b/g;

  for (const match of line.matchAll(runRegex)) {
    references.push({
      command: match[0],
      script: match[1],
    });
  }

  for (const match of line.matchAll(directRegex)) {
    references.push({
      command: match[0],
      script: match[1],
    });
  }

  return references;
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
  const rows = data.references
    .map(reference => `
      <tr>
        <td><span class="badge ${reference.exists ? "pass" : "fail"}">${reference.exists ? "PASS" : "MISSING"}</span></td>
        <td><code>${escapeHtml(reference.script)}</code></td>
        <td><code>${escapeHtml(reference.command)}</code></td>
        <td>${escapeHtml(reference.file)}:${reference.line}</td>
      </tr>`)
    .join("");

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autolab Doc Command Check</title>
  <style>
    body { margin: 0; background: #f7f8fb; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; line-height: 1.65; }
    main { max-width: 1120px; margin: 0 auto; padding: 44px 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    .notice { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 16px; margin: 22px 0; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e8edf5; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef2f8; font-weight: 700; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .badge { display: inline-flex; border-radius: 999px; padding: 3px 8px; font-size: 12px; font-weight: 800; }
    .pass { background: #dcfce7; color: #166534; }
    .fail { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <main>
    <h1>Autolab Doc Command Check</h1>
    <div class="notice">
      Generated at ${escapeHtml(data.generatedAt)}.
      Checked ${data.summary.checked} package-script references across ${data.scannedFiles} files.
      Missing: ${data.summary.missing}.
    </div>
    <table>
      <thead><tr><th>Status</th><th>Script</th><th>Command</th><th>Reference</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
</body>
</html>
`;
}
