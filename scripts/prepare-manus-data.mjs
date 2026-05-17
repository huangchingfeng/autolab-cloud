#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const DEFAULT_SOURCE =
  "/Users/huangjingfeng/Desktop/專案/_imports/aifengge-website-manus-source/.manus/db";

const TABLE_CONFIG = {
  categories: {
    columns: ["id", "name", "slug", "description", "createdAt", "updatedAt"],
    required: ["name", "slug"],
    serial: "id",
  },
  tags: {
    columns: ["id", "name", "slug", "createdAt"],
    required: ["name", "slug"],
    serial: "id",
  },
  posts: {
    columns: [
      "id",
      "title",
      "slug",
      "excerpt",
      "content",
      "coverImage",
      "categoryId",
      "authorId",
      "status",
      "publishedAt",
      "createdAt",
      "updatedAt",
      "viewCount",
    ],
    required: ["title", "slug", "content", "authorId"],
    serial: "id",
  },
  postTags: {
    columns: ["id", "postId", "tagId", "createdAt"],
    required: ["postId", "tagId"],
    serial: "id",
    syntheticKey: row => `${row.postId}:${row.tagId}`,
  },
  events: {
    columns: [
      "id",
      "title",
      "subtitle",
      "slug",
      "description",
      "highlights",
      "targetAudience",
      "speakerInfo",
      "coverImage",
      "videoUrl",
      "images",
      "eventDate",
      "eventEndDate",
      "eventTime",
      "location",
      "locationDetails",
      "meetingUrl",
      "externalRegistrationUrl",
      "price",
      "maxAttendees",
      "status",
      "registrationEnabled",
      "registrationDeadline",
      "registrationInfo",
      "tags",
      "createdAt",
      "updatedAt",
    ],
    required: ["title", "slug", "description", "eventDate", "location"],
    serial: "id",
  },
  eventRegistrations: {
    columns: [
      "id",
      "eventId",
      "name",
      "email",
      "phone",
      "attendeeCount",
      "profession",
      "referralPerson",
      "hasAiExperience",
      "aiToolsUsed",
      "hasTakenAiCourse",
      "courseExpectations",
      "company",
      "jobTitle",
      "referralSource",
      "bniChapter",
      "status",
      "emailSent",
      "subscribeNewsletter",
      "notes",
      "createdAt",
      "updatedAt",
    ],
    required: ["eventId", "name", "email", "phone"],
    serial: "id",
  },
  aiSuperSalesRegistrations: {
    columns: [
      "id",
      "name",
      "email",
      "phone",
      "company",
      "jobTitle",
      "selectedSessions",
      "referralSource",
      "subscribeNewsletter",
      "emailSent",
      "notes",
      "createdAt",
      "updatedAt",
    ],
    required: ["name", "email", "phone", "selectedSessions", "referralSource"],
    serial: "id",
  },
};

const options = {
  source: DEFAULT_SOURCE,
  json: "",
  html: "",
  defaultAuthorId: null,
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--source=")) options.source = arg.slice("--source=".length);
  if (arg.startsWith("--json=")) options.json = arg.slice("--json=".length);
  if (arg.startsWith("--html=")) options.html = arg.slice("--html=".length);
  if (arg.startsWith("--default-author-id=")) {
    options.defaultAuthorId = Number(arg.slice("--default-author-id=".length));
  }
}

const sourceDir = path.resolve(options.source);
if (!fs.existsSync(sourceDir)) {
  console.error(`Manus DB export folder not found: ${sourceDir}`);
  process.exit(1);
}

function inferTable(query = "") {
  const normalized = String(query).replace(/`/g, "").replace(/\s+/g, " ").trim();
  const match =
    normalized.match(/\bFROM\s+([A-Za-z0-9_]+)/i) ||
    normalized.match(/\bUPDATE\s+([A-Za-z0-9_]+)/i) ||
    normalized.match(/\bINTO\s+([A-Za-z0-9_]+)/i);
  return match?.[1] ?? "";
}

function normalizeNull(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "string" && value.toUpperCase() === "NULL") return null;
  return value;
}

function numeric(value) {
  const normalized = normalizeNull(value);
  if (normalized === null || normalized === undefined || normalized === "") return normalized;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : normalized;
}

function booleanish(value) {
  const normalized = normalizeNull(value);
  if (normalized === null || normalized === undefined || normalized === "") return normalized;
  if (normalized === true || normalized === false) return normalized;
  if (normalized === 1 || normalized === "1") return true;
  if (normalized === 0 || normalized === "0") return false;
  return normalized;
}

function parseJsonArray(value) {
  const normalized = normalizeNull(value);
  if (normalized === null || normalized === undefined || normalized === "") return normalized;
  if (Array.isArray(normalized)) return normalized;
  if (typeof normalized !== "string") return normalized;
  try {
    const parsed = JSON.parse(normalized);
    return Array.isArray(parsed) ? parsed : normalized;
  } catch {
    return normalized;
  }
}

function normalizeRow(table, row) {
  const normalized = {};
  for (const [key, rawValue] of Object.entries(row)) {
    if (key.includes("_preview") || key.endsWith("_preview")) continue;
    if (key === "tag_name" || key === "eventTitle") continue;

    let value = normalizeNull(rawValue);
    if (["id", "authorId", "categoryId", "postId", "tagId", "eventId", "price", "maxAttendees", "attendeeCount", "planPrice", "viewCount"].includes(key)) {
      value = numeric(value);
    }
    if (["registrationEnabled", "emailSent", "subscribeNewsletter", "hasAiExperience", "hasTakenAiCourse"].includes(key)) {
      value = booleanish(value);
    }
    if (table === "aiSuperSalesRegistrations" && key === "selectedSessions") {
      value = parseJsonArray(value);
    }

    normalized[key] = value;
  }

  if (table === "posts") {
    if (!normalized.status) normalized.status = "draft";
    if (normalized.viewCount === undefined || normalized.viewCount === null) normalized.viewCount = 0;
    if (!normalized.authorId && options.defaultAuthorId) normalized.authorId = options.defaultAuthorId;
  }

  if (table === "events") {
    if (!normalized.status) normalized.status = "draft";
    if (normalized.registrationEnabled === undefined || normalized.registrationEnabled === null) {
      normalized.registrationEnabled = true;
    }
    if (normalized.price === undefined || normalized.price === null) normalized.price = 0;
  }

  if (table === "eventRegistrations") {
    if (!normalized.status) normalized.status = "registered";
    if (normalized.emailSent === undefined || normalized.emailSent === null) normalized.emailSent = false;
    if (normalized.subscribeNewsletter === undefined || normalized.subscribeNewsletter === null) normalized.subscribeNewsletter = false;
  }

  if (table === "aiSuperSalesRegistrations") {
    if (normalized.subscribeNewsletter === undefined || normalized.subscribeNewsletter === null) {
      normalized.subscribeNewsletter = false;
    }
    if (normalized.emailSent === undefined || normalized.emailSent === null) normalized.emailSent = false;
  }

  return normalized;
}

function mergeRows(existing, incoming) {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined) continue;
    if (value === null && merged[key] !== undefined && merged[key] !== null) continue;
    if (value === "" && merged[key]) continue;
    if (key === "content" && typeof value === "string" && typeof merged[key] === "string" && merged[key].length > value.length) continue;
    if (key === "description" && typeof value === "string" && typeof merged[key] === "string" && merged[key].length > value.length) continue;
    merged[key] = value;
  }
  return merged;
}

function recordKey(table, row, file) {
  const config = TABLE_CONFIG[table];
  if (config?.syntheticKey) return config.syntheticKey(row);
  if (row.id !== undefined && row.id !== null && row.id !== "") return String(row.id);
  if (row.slug) return `slug:${row.slug}`;
  if (row.email) return `email:${row.email}`;
  return `file:${file}:${JSON.stringify(row).slice(0, 100)}`;
}

const mergedByTable = new Map();
const sourceIndex = new Map();
const files = fs.readdirSync(sourceDir).filter(file => file.endsWith(".json")).sort();

for (const file of files) {
  const fullPath = path.join(sourceDir, file);
  const payload = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  const table = inferTable(payload.query);
  if (!TABLE_CONFIG[table]) continue;

  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  if (rows.length === 0) continue;

  const tableRows = mergedByTable.get(table) ?? new Map();
  const tableSources = sourceIndex.get(table) ?? new Map();

  for (const row of rows) {
    const normalized = normalizeRow(table, row);
    const key = recordKey(table, normalized, file);
    tableRows.set(key, mergeRows(tableRows.get(key) ?? {}, normalized));
    const sources = tableSources.get(key) ?? [];
    sources.push(file);
    tableSources.set(key, sources);
  }

  mergedByTable.set(table, tableRows);
  sourceIndex.set(table, tableSources);
}

function isBlank(value) {
  return value === undefined || value === null || value === "";
}

function finalizeRow(table, row) {
  const config = TABLE_CONFIG[table];
  const output = {};
  for (const column of config.columns) {
    if (row[column] !== undefined) output[column] = row[column];
  }
  return output;
}

const tables = {};
const summary = {};

for (const [table, rowsByKey] of mergedByTable.entries()) {
  const config = TABLE_CONFIG[table];
  const importable = [];
  const needsReview = [];

  for (const [key, row] of rowsByKey.entries()) {
    const missing = config.required.filter(column => isBlank(row[column]));
    const finalized = finalizeRow(table, row);
    const item = {
      key,
      row: finalized,
      missing,
      sourceFiles: [...new Set(sourceIndex.get(table)?.get(key) ?? [])].slice(0, 8),
    };

    if (missing.length === 0) {
      importable.push(item);
    } else {
      needsReview.push(item);
    }
  }

  importable.sort((a, b) => String(a.row.id ?? a.key).localeCompare(String(b.row.id ?? b.key), "en", { numeric: true }));
  needsReview.sort((a, b) => b.missing.length - a.missing.length || String(a.key).localeCompare(String(b.key), "en", { numeric: true }));

  tables[table] = { importable, needsReview, columns: config.columns, required: config.required, serial: config.serial ?? null };
  summary[table] = {
    observed: rowsByKey.size,
    importable: importable.length,
    needsReview: needsReview.length,
    required: config.required,
  };
}

const packageData = {
  kind: "autolab-manus-data-package",
  generatedAt: new Date().toISOString(),
  sourceDir,
  defaultAuthorId: options.defaultAuthorId,
  warning: "This package is reconstructed from Manus query logs, not a full database dump. Import only into staging after review.",
  summary,
  tables,
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
  const rows = Object.entries(data.summary)
    .map(([table, stat]) => `
      <tr>
        <td>${escapeHtml(table)}</td>
        <td>${stat.observed}</td>
        <td>${stat.importable}</td>
        <td>${stat.needsReview}</td>
        <td>${escapeHtml(stat.required.join(", "))}</td>
      </tr>`)
    .join("");

  const reviewSections = Object.entries(data.tables)
    .map(([table, tableData]) => {
      const examples = tableData.needsReview.slice(0, 8)
        .map(item => `
          <details>
            <summary>${escapeHtml(item.key)} · missing: ${escapeHtml(item.missing.join(", "))}</summary>
            <p>Sources: ${escapeHtml(item.sourceFiles.join(", "))}</p>
            <pre>${escapeHtml(JSON.stringify(item.row, null, 2))}</pre>
          </details>`)
        .join("");
      return `<section><h2>${escapeHtml(table)}</h2>${examples || "<p>No review items.</p>"}</section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autolab Manus Data Package</title>
  <style>
    body { margin: 0; background: #f7f8fb; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; }
    main { max-width: 1120px; margin: 0 auto; padding: 40px 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    h2 { margin-top: 32px; font-size: 20px; }
    .warning { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 16px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e8edf5; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef2f8; }
    details { background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; margin: 10px 0; padding: 12px; }
    summary { cursor: pointer; color: #2450a6; }
    pre { overflow: auto; background: #0f172a; color: #e2e8f0; padding: 14px; border-radius: 6px; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  </style>
</head>
<body>
  <main>
    <h1>Autolab Manus Data Package</h1>
    <p>Generated at ${escapeHtml(data.generatedAt)}</p>
    <p><code>${escapeHtml(data.sourceDir)}</code></p>
    <div class="warning">${escapeHtml(data.warning)}</div>
    <h2>Summary</h2>
    <table>
      <thead><tr><th>Table</th><th>Observed</th><th>Importable</th><th>Needs Review</th><th>Required Fields</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <h2>Needs Review Examples</h2>
    ${reviewSections}
  </main>
</body>
</html>`;
}

writeFile(options.json, `${JSON.stringify(packageData, null, 2)}\n`);
writeFile(options.html, renderHtml(packageData));

console.log("Autolab Manus data package");
console.log("==========================");
console.log(`Source: ${sourceDir}`);
console.log(`Default author id: ${options.defaultAuthorId ?? "(none)"}`);
console.log("");
console.log("table\tobserved\timportable\tneedsReview");
for (const [table, stat] of Object.entries(summary)) {
  console.log(`${table}\t${stat.observed}\t${stat.importable}\t${stat.needsReview}`);
}
