#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const options = {
  reportsDir: "/Users/huangjingfeng/Desktop/專案/_reports",
  json: "/Users/huangjingfeng/Desktop/專案/_reports/autolab-production-cutover-gate.json",
  html: "/Users/huangjingfeng/Desktop/專案/_reports/autolab-production-cutover-gate.html",
  previewSmoke: "/Users/huangjingfeng/Desktop/專案/_reports/autolab-staging-smoke-preview.json",
  dumpReport: "/Users/huangjingfeng/Desktop/專案/_reports/autolab-manus-dump-inspection-current.json",
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--reports-dir=")) options.reportsDir = arg.slice("--reports-dir=".length);
  if (arg.startsWith("--json=")) options.json = arg.slice("--json=".length);
  if (arg.startsWith("--html=")) options.html = arg.slice("--html=".length);
  if (arg.startsWith("--preview-smoke=")) options.previewSmoke = arg.slice("--preview-smoke=".length);
  if (arg.startsWith("--dump-report=")) options.dumpReport = arg.slice("--dump-report=".length);
}

const reportsDir = path.resolve(options.reportsDir);
const reports = {
  readiness: readJson(path.join(reportsDir, "autolab-staging-readiness.json")),
  preflight: readJson(path.join(reportsDir, "autolab-staging-preflight.json")),
  localSmoke: readJson(path.join(reportsDir, "autolab-staging-smoke-local.json")),
  previewSmoke: readJson(options.previewSmoke),
  gitDeploy: readJson(path.join(reportsDir, "autolab-git-deploy-files.json")),
  sensitive: readJson(path.join(reportsDir, "autolab-sensitive-file-guard.json")),
  renderEnv: readJson(path.join(reportsDir, "autolab-render-env-check.json")),
  externalDeps: readJson(path.join(reportsDir, "autolab-external-dependencies.json")),
  dump: readJson(options.dumpReport),
};

const gates = [
  gate("Current Manus production protected", "pass", "This gate does not push, deploy, edit DNS, or call any production service."),
  gateFromBoolean(
    "Staging readiness has no required failures",
    reports.readiness?.summary?.fail === 0,
    formatReadiness(reports.readiness),
  ),
  gateFromBoolean(
    "Staging preflight is fully green",
    reports.preflight?.summary?.failed === 0,
    formatPreflight(reports.preflight),
  ),
  gateFromBoolean(
    "Local production smoke is green",
    smokePassed(reports.localSmoke),
    formatSmoke(reports.localSmoke, "local"),
  ),
  gateFromBoolean(
    "Preview smoke has been run and is green",
    smokePassed(reports.previewSmoke),
    reports.previewSmoke ? formatSmoke(reports.previewSmoke, "preview") : `Missing preview smoke report: ${path.resolve(options.previewSmoke)}`,
  ),
  gateFromBoolean(
    "Git deploy file gate is green",
    reports.gitDeploy?.summary?.tracked === reports.gitDeploy?.summary?.required && reports.gitDeploy?.summary?.missingFromGit?.length === 0,
    formatGitDeploy(reports.gitDeploy),
  ),
  gateFromBoolean(
    "Sensitive file guard is green",
    reports.sensitive?.summary?.trackedRiskFiles === 0,
    formatSensitive(reports.sensitive),
  ),
  gateFromBoolean(
    "Render env blueprint is consistent",
    reports.renderEnv?.summary?.missingInRender === 0 && reports.renderEnv?.summary?.duplicateRenderKeys === 0,
    formatRenderEnv(reports.renderEnv),
  ),
  gateFromBoolean(
    "No runtime Manus CDN dependencies",
    noBlockingRuntimeDependencies(reports.externalDeps),
    formatExternalDeps(reports.externalDeps),
  ),
  gateFromBoolean(
    "Full Manus production dump is present",
    dumpLooksComplete(reports.dump),
    formatDump(reports.dump),
  ),
];

const report = {
  generatedAt: new Date().toISOString(),
  reportsDir,
  previewSmoke: path.resolve(options.previewSmoke),
  dumpReport: path.resolve(options.dumpReport),
  summary: {
    pass: gates.filter(item => item.status === "pass").length,
    fail: gates.filter(item => item.status === "fail").length,
  },
  gates,
  decision: gates.every(item => item.status === "pass") ? "GO" : "NO_GO",
};

writeFile(options.json, `${JSON.stringify(report, null, 2)}\n`);
writeFile(options.html, renderHtml(report));

console.log("Autolab production cutover gate");
console.log("================================");
console.log(`Decision: ${report.decision}`);
console.log(`Gates: ${report.summary.pass} pass, ${report.summary.fail} fail`);
console.log(`Wrote ${path.resolve(options.html)}`);
console.log(`Wrote ${path.resolve(options.json)}`);

if (report.decision !== "GO") {
  process.exit(1);
}

function readJson(file) {
  const absolute = path.resolve(file);
  if (!fs.existsSync(absolute)) return null;
  try {
    return JSON.parse(fs.readFileSync(absolute, "utf8"));
  } catch {
    return null;
  }
}

function gate(name, status, detail) {
  return { name, status, detail };
}

function gateFromBoolean(name, ok, detail) {
  return gate(name, ok ? "pass" : "fail", detail);
}

function smokePassed(data) {
  if (!data) return false;
  if (typeof data.failed === "number") return data.failed === 0 && data.passed > 0;
  if (Array.isArray(data.results)) return data.results.length > 0 && data.results.every(item => item.ok);
  return false;
}

function formatReadiness(data) {
  if (!data?.summary) return "Missing readiness report.";
  return `${data.summary.pass} pass, ${data.summary.warn} warn, ${data.summary.fail} fail.`;
}

function formatPreflight(data) {
  if (!data?.summary) return "Missing preflight report.";
  const failures = data.results?.filter(item => !item.ok).map(item => item.name) ?? [];
  return `${data.summary.passed} passed, ${data.summary.allowedFailures} allowed failures, ${data.summary.failed} failed${failures.length ? `: ${failures.join(", ")}` : ""}.`;
}

function formatSmoke(data, label) {
  if (!data) return `Missing ${label} smoke report.`;
  const passed = data.passed ?? data.results?.filter(item => item.ok).length ?? 0;
  const failed = data.failed ?? data.results?.filter(item => !item.ok).length ?? 0;
  return `${label} smoke: ${passed} passed, ${failed} failed.`;
}

function formatGitDeploy(data) {
  if (!data?.summary) return "Missing Git deploy file report.";
  return `${data.summary.tracked}/${data.summary.required} tracked, ${data.summary.exists}/${data.summary.required} present on disk.`;
}

function formatSensitive(data) {
  if (!data?.summary) return "Missing sensitive file report.";
  return `${data.summary.ignored}/${data.summary.expectedIgnored} ignored, ${data.summary.trackedRiskFiles} risky files tracked.`;
}

function formatRenderEnv(data) {
  if (!data?.summary) return "Missing Render env report.";
  return `${data.summary.envKeys} keys checked, ${data.summary.missingInRender} missing, ${data.summary.extraInRender} extra, ${data.summary.duplicateRenderKeys} duplicate.`;
}

function noBlockingRuntimeDependencies(data) {
  if (!data?.occurrences) return false;
  return !data.occurrences.some(item => item.kind === "manus-cdn" || item.kind === "cloudfront-runtime");
}

function formatExternalDeps(data) {
  if (!data?.byKind) return "Missing external dependency report.";
  const summary = data.byKind.map(item => `${item.kind}: ${item.count}`).join(", ");
  return `${data.urlOccurrences} URL occurrences scanned. ${summary}.`;
}

function dumpLooksComplete(data) {
  if (!data) return false;
  const warnings = data.warnings ?? [];
  const missing = data.missingExpectedTables ?? [];
  if (warnings.some(warning => warning.toLowerCase().includes("query logs"))) return false;
  return data.inspectedFiles > 0 && data.observedTables > 0 && missing.length === 0;
}

function formatDump(data) {
  if (!data) return "Missing dump inspection report.";
  const missing = data.missingExpectedTables?.length ?? 0;
  const warnings = data.warnings?.length ? ` Warnings: ${data.warnings.join(" ")}` : "";
  return `${data.inspectedFiles} files inspected, ${data.observedTables} observed tables, ${missing} expected tables missing.${warnings}`;
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
  const rows = data.gates
    .map(item => `
      <tr>
        <td><span class="badge ${item.status}">${item.status === "pass" ? "PASS" : "BLOCKED"}</span></td>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.detail)}</td>
      </tr>`)
    .join("");

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autolab Production Cutover Gate</title>
  <style>
    body { margin: 0; background: #f7f8fb; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; line-height: 1.65; }
    main { max-width: 1120px; margin: 0 auto; padding: 44px 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    .notice { border-radius: 8px; padding: 14px 16px; margin: 22px 0; border: 1px solid #fecaca; background: #fef2f2; }
    .go { border-color: #bbf7d0; background: #f0fdf4; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e8edf5; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef2f8; font-weight: 700; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .badge { display: inline-flex; border-radius: 999px; padding: 3px 8px; font-size: 12px; font-weight: 800; }
    .pass { background: #dcfce7; color: #166534; }
    .fail { background: #fee2e2; color: #991b1b; }
    .meta { color: #647085; }
  </style>
</head>
<body>
  <main>
    <h1>Autolab Production Cutover Gate</h1>
    <p class="meta">Generated at ${escapeHtml(data.generatedAt)}</p>
    <div class="notice ${data.decision === "GO" ? "go" : ""}">
      <strong>Decision: ${escapeHtml(data.decision)}</strong><br />
      ${data.decision === "GO"
        ? "All gates are passing. This report still does not perform DNS or deployment actions."
        : "Do not cut over production. Keep Manus production untouched until every blocked gate is resolved."}
    </div>
    <table>
      <thead><tr><th>Status</th><th>Gate</th><th>Detail</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
</body>
</html>
`;
}
