#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const options = {
  roots: ["client/src", "client/public", "server", "render.yaml", "package.json"],
  json: "",
  html: "",
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--root=")) options.roots.push(arg.slice("--root=".length));
  if (arg.startsWith("--json=")) options.json = arg.slice("--json=".length);
  if (arg.startsWith("--html=")) options.html = arg.slice("--html=".length);
}

const repoRoot = process.cwd();
const urlPattern = /https?:\/\/[^\s"'`<>)\]}]+/g;
const assetExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".mov",
  ".mp4",
  ".pdf",
  ".png",
  ".svg",
  ".webp",
  ".xls",
  ".xlsx",
  ".zip",
]);

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

function readTextFile(file) {
  const stat = fs.statSync(file);
  if (stat.size > 2_000_000) return "";
  const buffer = fs.readFileSync(file);
  if (buffer.includes(0)) return "";
  return buffer.toString("utf8");
}

function normalizeUrl(raw) {
  return raw.replace(/[.,;:!?]+$/g, "");
}

function classifyUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { domain: "(invalid)", kind: "invalid", priority: "review" };
  }

  const domain = parsed.hostname.toLowerCase();
  const ext = path.extname(decodeURIComponent(parsed.pathname).toLowerCase());
  const looksLikeAsset = assetExtensions.has(ext);

  if (domain === "files.manuscdn.com") {
    return { domain, kind: "manus-cdn-asset", priority: "replace", looksLikeAsset };
  }
  if (domain.endsWith(".cloudfront.net")) {
    return { domain, kind: looksLikeAsset ? "cloudfront-asset" : "cloudfront-link", priority: "migrate", looksLikeAsset };
  }
  if (domain.endsWith("manus.space")) {
    return { domain, kind: "manus-tool-link", priority: "review", looksLikeAsset };
  }
  if (domain.endsWith("manus.im")) {
    return { domain, kind: "manus-invitation-link", priority: "review", looksLikeAsset };
  }
  if (looksLikeAsset) {
    return { domain, kind: "external-asset", priority: "review", looksLikeAsset };
  }
  return { domain, kind: "external-link", priority: "review", looksLikeAsset };
}

const files = [...new Set(options.roots.flatMap(walk))].sort();
const occurrences = [];

for (const file of files) {
  const text = readTextFile(file);
  if (!text) continue;

  const lines = text.split(/\r?\n/);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const matches = line.matchAll(urlPattern);
    for (const match of matches) {
      const url = normalizeUrl(match[0]);
      const classification = classifyUrl(url);
      occurrences.push({
        file: path.relative(repoRoot, file),
        line: lineIndex + 1,
        url,
        ...classification,
      });
    }
  }
}

const byDomain = new Map();
const byKind = new Map();
for (const occurrence of occurrences) {
  byDomain.set(occurrence.domain, (byDomain.get(occurrence.domain) ?? 0) + 1);
  byKind.set(occurrence.kind, (byKind.get(occurrence.kind) ?? 0) + 1);
}

const report = {
  generatedAt: new Date().toISOString(),
  repoRoot,
  scannedRoots: options.roots,
  scannedFiles: files.length,
  urlOccurrences: occurrences.length,
  byDomain: [...byDomain.entries()]
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain)),
  byKind: [...byKind.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind)),
  occurrences: occurrences.sort((a, b) =>
    a.priority.localeCompare(b.priority) ||
    a.domain.localeCompare(b.domain) ||
    a.file.localeCompare(b.file) ||
    a.line - b.line
  ),
};

function writeFile(target, contents) {
  if (!target) return;
  const absolute = path.resolve(repoRoot, target);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, contents);
  console.log(`Wrote ${absolute}`);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtml(data) {
  const domains = data.byDomain
    .map(item => `<tr><td>${escapeHtml(item.domain)}</td><td>${item.count}</td></tr>`)
    .join("");
  const kinds = data.byKind
    .map(item => `<tr><td>${escapeHtml(item.kind)}</td><td>${item.count}</td></tr>`)
    .join("");
  const rows = data.occurrences
    .map(item => `
      <tr>
        <td><span class="badge ${escapeHtml(item.priority)}">${escapeHtml(item.priority)}</span></td>
        <td>${escapeHtml(item.kind)}</td>
        <td>${escapeHtml(item.domain)}</td>
        <td>${escapeHtml(item.file)}:${item.line}</td>
        <td><a href="${escapeHtml(item.url)}">${escapeHtml(item.url)}</a></td>
      </tr>`)
    .join("");

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autolab External Dependency Audit</title>
  <style>
    body { margin: 0; background: #f7f8fb; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; }
    main { max-width: 1180px; margin: 0 auto; padding: 40px 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    h2 { margin-top: 32px; font-size: 20px; }
    .meta { color: #647085; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e8edf5; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef2f8; font-weight: 700; }
    a { color: #2450a6; word-break: break-all; }
    .badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 3px 8px; font-weight: 700; font-size: 12px; }
    .replace { background: #fee2e2; color: #991b1b; }
    .migrate { background: #fef3c7; color: #92400e; }
    .review { background: #e0f2fe; color: #075985; }
    @media (max-width: 820px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <h1>Autolab External Dependency Audit</h1>
    <p class="meta">Generated at ${escapeHtml(data.generatedAt)} · scanned ${data.scannedFiles} files · found ${data.urlOccurrences} URL occurrences.</p>
    <div class="grid">
      <section>
        <h2>Domains</h2>
        <table><thead><tr><th>Domain</th><th>Count</th></tr></thead><tbody>${domains}</tbody></table>
      </section>
      <section>
        <h2>Kinds</h2>
        <table><thead><tr><th>Kind</th><th>Count</th></tr></thead><tbody>${kinds}</tbody></table>
      </section>
    </div>
    <h2>Occurrences</h2>
    <table>
      <thead><tr><th>Priority</th><th>Kind</th><th>Domain</th><th>Location</th><th>URL</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
</body>
</html>`;
}

writeFile(options.json, `${JSON.stringify(report, null, 2)}\n`);
writeFile(options.html, renderHtml(report));

console.log(`Scanned ${report.scannedFiles} files.`);
console.log(`Found ${report.urlOccurrences} URL occurrences across ${report.byDomain.length} domains.`);
for (const item of report.byKind) {
  console.log(`${item.kind}: ${item.count}`);
}
