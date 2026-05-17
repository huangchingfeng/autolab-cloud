#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";

const DEFAULT_SOURCE = "/Users/huangjingfeng/Desktop/專案/_imports/manus-production-dump";

const expectedTables = [
  "users",
  "categories",
  "tags",
  "posts",
  "postTags",
  "contacts",
  "events",
  "eventRegistrations",
  "articleAccessWhitelist",
  "downloadLeads",
  "promoCodes",
  "orders",
  "videoCourses",
  "videoCoursePurchases",
  "videoCourseNotes",
  "videoCourseReviews",
  "courseRegistrations2026",
  "notifications",
  "notificationReads",
  "courseSessions2026",
  "courseAttendance2026",
  "courseTransfers2026",
  "aiSuperSalesRegistrations",
  "corporateInquiries",
];

const options = {
  source: DEFAULT_SOURCE,
  json: "",
  html: "",
  maxJsonBytes: 50_000_000,
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--source=")) options.source = arg.slice("--source=".length);
  if (arg.startsWith("--json=")) options.json = arg.slice("--json=".length);
  if (arg.startsWith("--html=")) options.html = arg.slice("--html=".length);
  if (arg.startsWith("--max-json-bytes=")) options.maxJsonBytes = Number(arg.slice("--max-json-bytes=".length));
}

const sourcePath = path.resolve(options.source);
if (!fs.existsSync(sourcePath)) {
  console.error(`Dump source not found: ${sourcePath}`);
  process.exit(1);
}

const tableStats = new Map();
const files = getFiles(sourcePath);
const fileReports = [];
const warnings = [];

for (const file of files) {
  const report = await inspectFile(file);
  fileReports.push(report);
}

const tables = [...tableStats.values()]
  .map(stat => ({
    table: stat.table,
    rows: stat.rows,
    sources: [...stat.sources].sort(),
    columns: [...stat.columns].sort(),
    evidence: stat.evidence.slice(0, 8),
  }))
  .sort((a, b) => b.rows - a.rows || a.table.localeCompare(b.table));

const observedTableNames = new Set(tables.map(table => normalizeTableName(table.table)));
const missingExpectedTables = expectedTables.filter(table => !observedTableNames.has(normalizeTableName(table)));
const looksLikeQueryLogs = files.length > 0 && files.every(file => path.basename(file).startsWith("db-query"));

if (looksLikeQueryLogs) {
  warnings.push("Source looks like Manus query logs, not a full database dump.");
}
if (missingExpectedTables.length > 0) {
  warnings.push(`Missing ${missingExpectedTables.length}/${expectedTables.length} expected tables from current schema.`);
}

const report = {
  kind: "autolab-manus-dump-inspection",
  generatedAt: new Date().toISOString(),
  sourcePath,
  inspectedFiles: files.length,
  totalRows: tables.reduce((sum, table) => sum + table.rows, 0),
  observedTables: tables.length,
  expectedTables,
  missingExpectedTables,
  warnings,
  byKind: summarizeByKind(fileReports),
  tables,
  files: fileReports,
};

writeFile(options.json, `${JSON.stringify(report, null, 2)}\n`);
writeFile(options.html, renderHtml(report));

console.log(`Inspected ${report.inspectedFiles} files.`);
console.log(`Observed ${report.observedTables} tables and ${report.totalRows} approximate rows.`);
if (warnings.length > 0) {
  for (const warning of warnings) console.log(`WARN ${warning}`);
}
if (options.html) console.log(`Wrote ${path.resolve(options.html)}`);
if (options.json) console.log(`Wrote ${path.resolve(options.json)}`);

function getFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  if (!stat.isDirectory()) return [];

  const result = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const child = path.join(target, entry.name);
    if (entry.isDirectory()) result.push(...getFiles(child));
    if (entry.isFile() && isSupportedFile(entry.name)) result.push(child);
  }
  return result.sort();
}

function isSupportedFile(file) {
  const lower = file.toLowerCase();
  return [
    ".csv",
    ".json",
    ".jsonl",
    ".ndjson",
    ".sql",
    ".dump",
    ".txt",
  ].some(ext => lower.endsWith(ext));
}

async function inspectFile(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".json") return inspectJsonFile(file);
  if (ext === ".jsonl" || ext === ".ndjson") return inspectJsonlFile(file);
  if (ext === ".csv") return inspectCsvFile(file);
  if (ext === ".sql" || ext === ".dump" || ext === ".txt") return inspectSqlFile(file);
  return createFileReport(file, "unknown");
}

function inspectJsonFile(file) {
  const stat = fs.statSync(file);
  const result = createFileReport(file, "json", stat.size);
  if (stat.size > options.maxJsonBytes) {
    result.warning = `Skipped JSON parse because file is larger than ${options.maxJsonBytes} bytes.`;
    return result;
  }

  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    result.error = `Invalid JSON: ${error.message}`;
    return result;
  }

  if (Array.isArray(payload)) {
    recordRows(tableFromFilename(file), payload, file, "top-level array");
    result.tables.push({ table: tableFromFilename(file), rows: payload.length, columns: columnsFromRows(payload) });
    return result;
  }

  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.rows)) {
      const table = inferTable(payload.query) || tableFromFilename(file);
      recordRows(table, payload.rows, file, "rows array");
      result.tables.push({ table, rows: payload.rows.length, columns: columnsFromRows(payload.rows) });
      return result;
    }

    if (payload.tables && typeof payload.tables === "object") {
      for (const [table, value] of Object.entries(payload.tables)) {
        const rows = Array.isArray(value) ? value : Array.isArray(value?.rows) ? value.rows : [];
        recordRows(table, rows, file, "tables object");
        result.tables.push({ table, rows: rows.length, columns: columnsFromRows(rows) });
      }
      return result;
    }

    for (const [key, value] of Object.entries(payload)) {
      if (!Array.isArray(value)) continue;
      const table = key;
      recordRows(table, value, file, "object array property");
      result.tables.push({ table, rows: value.length, columns: columnsFromRows(value) });
    }
  }

  if (result.tables.length === 0) {
    result.warning = "No rows detected in JSON file.";
  }
  return result;
}

async function inspectJsonlFile(file) {
  const result = createFileReport(file, "jsonl", fs.statSync(file).size);
  const table = tableFromFilename(file);
  let rows = 0;
  const columns = new Set();

  for await (const line of readLines(file)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const row = JSON.parse(trimmed);
      rows += 1;
      if (row && typeof row === "object" && !Array.isArray(row)) {
        for (const key of Object.keys(row)) columns.add(key);
      }
    } catch (error) {
      result.error = `Invalid JSONL near row ${rows + 1}: ${error.message}`;
      break;
    }
  }

  recordApproxRows(table, rows, columns, file, "jsonl");
  result.tables.push({ table, rows, columns: [...columns].sort() });
  return result;
}

async function inspectCsvFile(file) {
  const result = createFileReport(file, "csv", fs.statSync(file).size);
  const table = tableFromFilename(file);
  let header = null;
  let rows = 0;

  for await (const line of readLines(file)) {
    if (header === null) {
      header = parseCsvLine(line).map(item => item.trim()).filter(Boolean);
      continue;
    }
    if (line.trim()) rows += 1;
  }

  recordApproxRows(table, rows, new Set(header || []), file, "csv");
  result.tables.push({ table, rows, columns: header || [] });
  return result;
}

async function inspectSqlFile(file) {
  const result = createFileReport(file, "sql", fs.statSync(file).size);
  const createTableColumns = new Map();
  let currentCreateTable = "";
  let collectingCreate = false;
  let currentCopyTable = "";
  let copyRows = 0;

  for await (const rawLine of readLines(file)) {
    const line = rawLine.trim();
    if (!line) continue;

    const createMatch = line.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([A-Za-z0-9_]+)["`]?/i);
    if (createMatch) {
      currentCreateTable = createMatch[1];
      collectingCreate = true;
      createTableColumns.set(currentCreateTable, createTableColumns.get(currentCreateTable) || new Set());
      result.tables.push({ table: currentCreateTable, rows: 0, columns: [] });
      continue;
    }

    if (collectingCreate) {
      if (line.startsWith(")") || line.endsWith(");")) {
        collectingCreate = false;
        currentCreateTable = "";
        continue;
      }
      const columnMatch = line.match(/^["`]?([A-Za-z0-9_]+)["`]?\s+[A-Za-z]/);
      if (columnMatch && !isSqlConstraint(columnMatch[1])) {
        createTableColumns.get(currentCreateTable)?.add(columnMatch[1]);
      }
      continue;
    }

    const copyMatch = line.match(/^COPY\s+["`]?([A-Za-z0-9_]+)["`]?\s*(?:\(([^)]+)\))?\s+FROM\s+stdin/i);
    if (copyMatch) {
      currentCopyTable = copyMatch[1];
      copyRows = 0;
      const columns = splitSqlIdentifierList(copyMatch[2] || "");
      recordApproxRows(currentCopyTable, 0, new Set(columns), file, "copy-start");
      continue;
    }

    if (currentCopyTable) {
      if (line === "\\.") {
        recordApproxRows(currentCopyTable, copyRows, new Set(), file, "copy rows");
        const tableResult = result.tables.find(item => item.table === currentCopyTable);
        if (tableResult) tableResult.rows += copyRows;
        else result.tables.push({ table: currentCopyTable, rows: copyRows, columns: [] });
        currentCopyTable = "";
        copyRows = 0;
      } else {
        copyRows += 1;
      }
      continue;
    }

    const insertMatch = line.match(/^INSERT\s+INTO\s+["`]?([A-Za-z0-9_]+)["`]?\s*(?:\(([^)]+)\))?/i);
    if (insertMatch) {
      const table = insertMatch[1];
      const columns = splitSqlIdentifierList(insertMatch[2] || "");
      const rows = estimateInsertRows(line);
      recordApproxRows(table, rows, new Set(columns), file, "insert");
      const tableResult = result.tables.find(item => item.table === table);
      if (tableResult) {
        tableResult.rows += rows;
        tableResult.columns = [...new Set([...(tableResult.columns || []), ...columns])].sort();
      } else {
        result.tables.push({ table, rows, columns });
      }
    }
  }

  for (const [table, columns] of createTableColumns.entries()) {
    const tableResult = result.tables.find(item => item.table === table);
    if (tableResult) tableResult.columns = [...new Set([...(tableResult.columns || []), ...columns])].sort();
    recordApproxRows(table, 0, columns, file, "create table");
  }

  return result;
}

function createFileReport(file, kind, size = fs.existsSync(file) ? fs.statSync(file).size : 0) {
  return {
    file: path.relative(process.cwd(), file),
    absolutePath: file,
    kind,
    size,
    tables: [],
  };
}

async function* readLines(file) {
  const stream = fs.createReadStream(file, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) yield line;
}

function inferTable(query = "") {
  const normalized = String(query).replace(/`/g, "").replace(/"/g, "").replace(/\s+/g, " ").trim();
  const match =
    normalized.match(/\bFROM\s+([A-Za-z0-9_]+)/i) ||
    normalized.match(/\bUPDATE\s+([A-Za-z0-9_]+)/i) ||
    normalized.match(/\bINTO\s+([A-Za-z0-9_]+)/i);
  return match?.[1] || "";
}

function tableFromFilename(file) {
  return path.basename(file)
    .replace(/\.(csv|json|jsonl|ndjson|sql|dump|txt)$/i, "")
    .replace(/^export[-_]/i, "")
    .replace(/^table[-_]/i, "")
    .replace(/[-.]/g, "_");
}

function columnsFromRows(rows) {
  const columns = new Set();
  for (const row of rows.slice(0, 1000)) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    for (const key of Object.keys(row)) columns.add(key);
  }
  return [...columns].sort();
}

function recordRows(table, rows, file, evidence) {
  recordApproxRows(table, rows.length, new Set(columnsFromRows(rows)), file, evidence);
}

function recordApproxRows(table, rows, columns, file, evidence) {
  const normalizedTable = table || "(unknown)";
  const existing = tableStats.get(normalizedTable) || {
    table: normalizedTable,
    rows: 0,
    sources: new Set(),
    columns: new Set(),
    evidence: [],
  };
  existing.rows += rows;
  existing.sources.add(path.relative(process.cwd(), file));
  for (const column of columns) existing.columns.add(String(column).replace(/["`]/g, "").trim());
  if (evidence && existing.evidence.length < 8) existing.evidence.push(evidence);
  tableStats.set(normalizedTable, existing);
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function splitSqlIdentifierList(value) {
  if (!value) return [];
  return value
    .split(",")
    .map(item => item.trim().replace(/["`]/g, ""))
    .filter(Boolean);
}

function estimateInsertRows(line) {
  const valuesIndex = line.toUpperCase().indexOf("VALUES");
  if (valuesIndex === -1) return 1;
  const values = line.slice(valuesIndex + "VALUES".length);
  const groups = values.match(/\([^()]*\)/g);
  return Math.max(1, groups?.length || 1);
}

function isSqlConstraint(value) {
  return ["CONSTRAINT", "PRIMARY", "UNIQUE", "KEY", "INDEX", "FOREIGN", "CHECK"].includes(String(value).toUpperCase());
}

function normalizeTableName(value) {
  return String(value).toLowerCase();
}

function summarizeByKind(items) {
  const byKind = new Map();
  for (const item of items) {
    byKind.set(item.kind, (byKind.get(item.kind) || 0) + 1);
  }
  return [...byKind.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind));
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
  const warnings = data.warnings.length > 0
    ? data.warnings.map(warning => `<li>${escapeHtml(warning)}</li>`).join("")
    : "<li>No structural warnings from this inspection.</li>";

  const kindRows = data.byKind
    .map(item => `<tr><td>${escapeHtml(item.kind)}</td><td>${item.count}</td></tr>`)
    .join("");

  const tableRows = data.tables
    .map(table => `
      <tr>
        <td>${escapeHtml(table.table)}</td>
        <td>${table.rows}</td>
        <td>${table.sources.length}</td>
        <td>${escapeHtml(table.columns.slice(0, 24).join(", "))}</td>
      </tr>`)
    .join("");

  const missingRows = data.missingExpectedTables
    .map(table => `<tr><td>${escapeHtml(table)}</td></tr>`)
    .join("");

  const fileRows = data.files
    .slice(0, 200)
    .map(file => `
      <tr>
        <td>${escapeHtml(file.file)}</td>
        <td>${escapeHtml(file.kind)}</td>
        <td>${file.size}</td>
        <td>${escapeHtml(file.tables.map(item => `${item.table} (${item.rows})`).join(", "))}</td>
        <td>${escapeHtml(file.error || file.warning || "")}</td>
      </tr>`)
    .join("");

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autolab Manus Dump Inspection</title>
  <style>
    body { margin: 0; background: #f7f8fb; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; }
    main { max-width: 1180px; margin: 0 auto; padding: 40px 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    h2 { margin-top: 32px; font-size: 20px; }
    .meta { color: #647085; }
    .cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 24px 0; }
    .card { background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; padding: 16px; }
    .num { font-size: 28px; font-weight: 800; }
    .warn { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 16px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e8edf5; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef2f8; font-weight: 700; }
    @media (max-width: 820px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  </style>
</head>
<body>
  <main>
    <h1>Autolab Manus Dump Inspection</h1>
    <p class="meta">Generated at ${escapeHtml(data.generatedAt)} from ${escapeHtml(data.sourcePath)}</p>
    <div class="cards">
      <div class="card"><div class="num">${data.inspectedFiles}</div><div>Inspected files</div></div>
      <div class="card"><div class="num">${data.observedTables}</div><div>Observed tables</div></div>
      <div class="card"><div class="num">${data.totalRows}</div><div>Approx rows</div></div>
      <div class="card"><div class="num">${data.missingExpectedTables.length}</div><div>Missing expected tables</div></div>
    </div>
    <section class="warn">
      <strong>Warnings</strong>
      <ul>${warnings}</ul>
    </section>
    <h2>File Kinds</h2>
    <table><thead><tr><th>Kind</th><th>Count</th></tr></thead><tbody>${kindRows}</tbody></table>
    <h2>Observed Tables</h2>
    <table><thead><tr><th>Table</th><th>Rows</th><th>Sources</th><th>Columns</th></tr></thead><tbody>${tableRows}</tbody></table>
    <h2>Missing Expected Tables</h2>
    <table><thead><tr><th>Table</th></tr></thead><tbody>${missingRows || "<tr><td>None</td></tr>"}</tbody></table>
    <h2>Files</h2>
    <table><thead><tr><th>File</th><th>Kind</th><th>Bytes</th><th>Detected Tables</th><th>Notes</th></tr></thead><tbody>${fileRows}</tbody></table>
  </main>
</body>
</html>`;
}
