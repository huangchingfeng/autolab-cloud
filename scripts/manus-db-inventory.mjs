#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const DEFAULT_SOURCE =
  "/Users/huangjingfeng/Desktop/專案/_imports/aifengge-website-manus-source/.manus/db";

const options = {
  source: DEFAULT_SOURCE,
  json: "",
  html: "",
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--source=")) options.source = arg.slice("--source=".length);
  if (arg.startsWith("--json=")) options.json = arg.slice("--json=".length);
  if (arg.startsWith("--html=")) options.html = arg.slice("--html=".length);
}

const sourceDir = path.resolve(options.source);
if (!fs.existsSync(sourceDir)) {
  console.error(`Manus DB export folder not found: ${sourceDir}`);
  process.exit(1);
}

const files = fs.readdirSync(sourceDir).filter(file => file.endsWith(".json")).sort();
const tableStats = new Map();
const errors = [];
let totalRows = 0;
let rowFiles = 0;

function inferTable(query = "") {
  const normalized = String(query).replace(/`/g, "").replace(/\s+/g, " ").trim();
  const match =
    normalized.match(/\bFROM\s+([A-Za-z0-9_]+)/i) ||
    normalized.match(/\bUPDATE\s+([A-Za-z0-9_]+)/i) ||
    normalized.match(/\bINTO\s+([A-Za-z0-9_]+)/i);
  return match?.[1] ?? "(unknown)";
}

function getTableStat(table) {
  const existing = tableStats.get(table);
  if (existing) return existing;
  const created = {
    table,
    files: 0,
    rowFiles: 0,
    rows: 0,
    errors: 0,
    ids: new Set(),
    columns: new Set(),
    samples: [],
  };
  tableStats.set(table, created);
  return created;
}

for (const file of files) {
  const fullPath = path.join(sourceDir, file);
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    errors.push({ file, message: `Invalid JSON: ${error.message}` });
    continue;
  }

  const table = inferTable(payload.query);
  const stat = getTableStat(table);
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const hasError = file.includes("error") || Boolean(payload.returncode);

  stat.files += 1;
  stat.rows += rows.length;
  if (rows.length > 0) stat.rowFiles += 1;
  if (hasError) stat.errors += 1;

  totalRows += rows.length;
  if (rows.length > 0) rowFiles += 1;
  if (hasError) {
    errors.push({
      file,
      table,
      query: payload.query,
      message: payload.logs?.join("\n") || payload.stderr || `returncode ${payload.returncode}`,
    });
  }

  for (const row of rows) {
    for (const key of Object.keys(row)) stat.columns.add(key);
    if (row.id !== undefined) stat.ids.add(String(row.id));
  }

  if (rows.length > 0 && stat.samples.length < 3) {
    stat.samples.push({
      file,
      query: String(payload.query || "").replace(/\s+/g, " ").trim(),
      rows: rows.slice(0, 2),
    });
  }
}

const tables = [...tableStats.values()]
  .map(stat => ({
    table: stat.table,
    files: stat.files,
    rowFiles: stat.rowFiles,
    rows: stat.rows,
    errors: stat.errors,
    uniqueIds: stat.ids.size,
    columns: [...stat.columns].sort(),
    samples: stat.samples,
  }))
  .sort((a, b) => b.rows - a.rows || b.files - a.files || a.table.localeCompare(b.table));

const inventory = {
  generatedAt: new Date().toISOString(),
  sourceDir,
  files: files.length,
  rowFiles,
  totalRows,
  errorFiles: errors.length,
  tables,
  errors: errors.slice(0, 50),
};

function writeFile(target, contents) {
  if (!target) return;
  const absolute = path.resolve(target);
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
  const topTables = data.tables
    .map(table => `
      <tr>
        <td>${escapeHtml(table.table)}</td>
        <td>${table.files}</td>
        <td>${table.rowFiles}</td>
        <td>${table.rows}</td>
        <td>${table.uniqueIds}</td>
        <td>${table.errors}</td>
        <td>${escapeHtml(table.columns.slice(0, 18).join(", "))}</td>
      </tr>`)
    .join("");

  const samples = data.tables
    .filter(table => table.samples.length > 0)
    .slice(0, 12)
    .map(table => `
      <section>
        <h2>${escapeHtml(table.table)}</h2>
        ${table.samples.map(sample => `
          <details>
            <summary>${escapeHtml(sample.file)} · ${escapeHtml(sample.query)}</summary>
            <pre>${escapeHtml(JSON.stringify(sample.rows, null, 2))}</pre>
          </details>`).join("")}
      </section>`)
    .join("");

  const errorRows = data.errors
    .map(error => `
      <tr>
        <td>${escapeHtml(error.file)}</td>
        <td>${escapeHtml(error.table || "")}</td>
        <td>${escapeHtml(String(error.message || "").slice(0, 240))}</td>
      </tr>`)
    .join("");

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autolab Manus DB Inventory</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; margin: 0; color: #172033; background: #f7f8fb; }
    main { max-width: 1180px; margin: 0 auto; padding: 40px 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    h2 { margin-top: 32px; font-size: 20px; }
    .meta { color: #647085; }
    .cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 24px 0; }
    .card { background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; padding: 16px; }
    .num { font-size: 28px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e8edf5; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef2f8; font-weight: 700; }
    details { background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; margin: 10px 0; padding: 12px; }
    summary { cursor: pointer; color: #2450a6; }
    pre { overflow: auto; background: #0f172a; color: #e2e8f0; padding: 14px; border-radius: 6px; }
    @media (max-width: 780px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  </style>
</head>
<body>
  <main>
    <h1>Autolab Manus DB Inventory</h1>
    <p class="meta">Generated at ${escapeHtml(data.generatedAt)} from ${escapeHtml(data.sourceDir)}</p>
    <div class="cards">
      <div class="card"><div class="num">${data.files}</div><div>JSON files</div></div>
      <div class="card"><div class="num">${data.rowFiles}</div><div>files with rows</div></div>
      <div class="card"><div class="num">${data.totalRows}</div><div>observed rows</div></div>
      <div class="card"><div class="num">${data.errorFiles}</div><div>error files</div></div>
    </div>
    <h2>Table Summary</h2>
    <table>
      <thead><tr><th>Table</th><th>Files</th><th>Row Files</th><th>Rows</th><th>Unique IDs</th><th>Errors</th><th>Observed Columns</th></tr></thead>
      <tbody>${topTables}</tbody>
    </table>
    <h2>Sample Rows</h2>
    ${samples}
    <h2>Errors</h2>
    <table>
      <thead><tr><th>File</th><th>Table</th><th>Message</th></tr></thead>
      <tbody>${errorRows}</tbody>
    </table>
  </main>
</body>
</html>`;
}

writeFile(options.json, `${JSON.stringify(inventory, null, 2)}\n`);
writeFile(options.html, renderHtml(inventory));

console.log("Autolab Manus DB inventory");
console.log("==========================");
console.log(`Source: ${sourceDir}`);
console.log(`Files: ${inventory.files}`);
console.log(`Files with rows: ${inventory.rowFiles}`);
console.log(`Observed rows: ${inventory.totalRows}`);
console.log(`Error files: ${inventory.errorFiles}`);
console.log("");
console.log("table\tfiles\trowFiles\trows\tuniqueIds\terrors");
for (const table of inventory.tables.slice(0, 20)) {
  console.log(`${table.table}\t${table.files}\t${table.rowFiles}\t${table.rows}\t${table.uniqueIds}\t${table.errors}`);
}
