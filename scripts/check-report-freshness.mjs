#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const options = {
  reportsDir: "/Users/huangjingfeng/Desktop/專案/_reports",
  maxAgeHours: 24,
  json: "/Users/huangjingfeng/Desktop/專案/_reports/autolab-report-freshness.json",
  html: "/Users/huangjingfeng/Desktop/專案/_reports/autolab-report-freshness.html",
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--reports-dir=")) options.reportsDir = arg.slice("--reports-dir=".length);
  if (arg.startsWith("--max-age-hours=")) options.maxAgeHours = Number(arg.slice("--max-age-hours=".length));
  if (arg.startsWith("--json=")) options.json = arg.slice("--json=".length);
  if (arg.startsWith("--html=")) options.html = arg.slice("--html=".length);
}

const reportsDir = path.resolve(options.reportsDir);
const requiredReports = [
  { file: "autolab-staging-readiness.json", label: "Staging readiness" },
  { file: "autolab-staging-preflight.json", label: "Staging preflight" },
  { file: "autolab-staging-smoke-local.json", label: "Local smoke" },
  { file: "autolab-git-deploy-files.json", label: "Git deploy files" },
  { file: "autolab-sensitive-file-guard.json", label: "Sensitive file guard" },
  { file: "autolab-render-env-check.json", label: "Render env check" },
  { file: "autolab-external-dependencies.json", label: "External dependency audit" },
  { file: "autolab-doc-command-check.json", label: "Doc command check" },
  { file: "autolab-production-cutover-gate.json", label: "Production cutover gate" },
];

const now = Date.now();
const maxAgeMs = options.maxAgeHours * 60 * 60 * 1000;
const rows = requiredReports.map(report => inspectReport(report));
const summary = {
  total: rows.length,
  fresh: rows.filter(row => row.status === "fresh").length,
  stale: rows.filter(row => row.status === "stale").length,
  missing: rows.filter(row => row.status === "missing").length,
  invalid: rows.filter(row => row.status === "invalid").length,
};

const output = {
  generatedAt: new Date(now).toISOString(),
  reportsDir,
  maxAgeHours: options.maxAgeHours,
  summary,
  rows,
};

writeFile(options.json, `${JSON.stringify(output, null, 2)}\n`);
writeFile(options.html, renderHtml(output));

console.log("Autolab report freshness check");
console.log("==============================");
console.log(`Fresh: ${summary.fresh}/${summary.total}`);
console.log(`Stale: ${summary.stale}; missing: ${summary.missing}; invalid: ${summary.invalid}`);
console.log(`Wrote ${path.resolve(options.html)}`);
console.log(`Wrote ${path.resolve(options.json)}`);

if (summary.fresh !== summary.total) {
  process.exit(1);
}

function inspectReport(report) {
  const absolute = path.join(reportsDir, report.file);
  if (!fs.existsSync(absolute)) {
    return {
      ...report,
      path: absolute,
      status: "missing",
      generatedAt: "",
      ageHours: null,
      detail: "Report file does not exist.",
    };
  }

  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(absolute, "utf8"));
  } catch (error) {
    return {
      ...report,
      path: absolute,
      status: "invalid",
      generatedAt: "",
      ageHours: null,
      detail: `Invalid JSON: ${error.message}`,
    };
  }

  const generatedAt = payload.generatedAt;
  const timestamp = Date.parse(generatedAt);
  if (!generatedAt || Number.isNaN(timestamp)) {
    return {
      ...report,
      path: absolute,
      status: "invalid",
      generatedAt: generatedAt || "",
      ageHours: null,
      detail: "Missing or invalid generatedAt.",
    };
  }

  const ageHours = (now - timestamp) / (60 * 60 * 1000);
  const fresh = ageHours >= 0 && ageHours <= options.maxAgeHours;
  return {
    ...report,
    path: absolute,
    status: fresh ? "fresh" : "stale",
    generatedAt,
    ageHours: Number(ageHours.toFixed(2)),
    detail: fresh ? "Fresh enough for current local decision-making." : `Older than ${options.maxAgeHours} hours; rerun the matching gate.`,
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
  const rows = data.rows
    .map(row => `
      <tr>
        <td><span class="badge ${row.status}">${escapeHtml(row.status.toUpperCase())}</span></td>
        <td>${escapeHtml(row.label)}</td>
        <td><code>${escapeHtml(row.file)}</code></td>
        <td>${escapeHtml(row.generatedAt)}</td>
        <td>${row.ageHours ?? ""}</td>
        <td>${escapeHtml(row.detail)}</td>
      </tr>`)
    .join("");

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autolab Report Freshness</title>
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
    .fresh { background: #dcfce7; color: #166534; }
    .stale, .missing, .invalid { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <main>
    <h1>Autolab Report Freshness</h1>
    <div class="notice">
      Generated at ${escapeHtml(data.generatedAt)}. Required freshness window: ${data.maxAgeHours} hours.
      Fresh reports: ${data.summary.fresh}/${data.summary.total}.
    </div>
    <table>
      <thead><tr><th>Status</th><th>Report</th><th>File</th><th>Generated At</th><th>Age Hours</th><th>Detail</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
</body>
</html>
`;
}
