#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const options = {
  reportsDir: "/Users/huangjingfeng/Desktop/專案/_reports",
  output: "docs/autolab-migration-index.html",
  json: "",
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--reports-dir=")) options.reportsDir = arg.slice("--reports-dir=".length);
  if (arg.startsWith("--output=")) options.output = arg.slice("--output=".length);
  if (arg.startsWith("--json=")) options.json = arg.slice("--json=".length);
}

const repoRoot = process.cwd();
const reportsDir = path.resolve(options.reportsDir);

const reports = {
  preflight: readReport("autolab-staging-preflight.json"),
  readiness: readReport("autolab-staging-readiness.json"),
  smoke: readReport("autolab-staging-smoke-local.json"),
  gitDeploy: readReport("autolab-git-deploy-files.json"),
  docCommands: readReport("autolab-doc-command-check.json"),
  sensitive: readReport("autolab-sensitive-file-guard.json"),
  renderEnv: readReport("autolab-render-env-check.json"),
  reportFreshness: readReport("autolab-report-freshness.json"),
  cutoverGate: readReport("autolab-production-cutover-gate.json"),
  externalDeps: readReport("autolab-external-dependencies.json"),
  dbInventory: readReport("autolab-manus-db-inventory.json"),
  dataPackage: readReport("autolab-manus-data-package.json"),
  dumpInspection: readReport("autolab-manus-dump-inspection-current.json"),
};

const git = {
  branch: gitText(["branch", "--show-current"]),
};

const readinessFailures = reports.readiness?.checks?.filter(check => check.status === "fail") ?? [];
const readinessWarnings = reports.readiness?.checks?.filter(check => check.status === "warn") ?? [];
const preflightFailures = reports.preflight?.results?.filter(result => !result.ok) ?? [];
const smokePassed = reports.smoke?.passed ?? reports.smoke?.results?.filter(result => result.ok).length ?? 0;
const smokeFailed = reports.smoke?.failed ?? reports.smoke?.results?.filter(result => !result.ok).length ?? 0;
const externalByKind = reports.externalDeps?.byKind ?? [];

const gates = [
  {
    name: "現有 Manus production",
    status: "pass",
    detail: "本機 staging 分支繼續準備；尚未推送、部署、改 DNS 或替換目前 Manus 網站。",
  },
  {
    name: "Git-backed deploy 檔案",
    status: reports.gitDeploy?.summary?.tracked === reports.gitDeploy?.summary?.required ? "pass" : "fail",
    detail: formatGitDeploySummary(reports.gitDeploy),
  },
  {
    name: "敏感檔案防護",
    status: reports.sensitive?.summary?.trackedRiskFiles === 0 ? "pass" : "fail",
    detail: formatSensitiveSummary(reports.sensitive),
  },
  {
    name: "Documented command references",
    status: reports.docCommands?.summary?.missing === 0 ? "pass" : "fail",
    detail: reports.docCommands?.summary
      ? `${reports.docCommands.summary.existing}/${reports.docCommands.summary.checked} documented package-script references exist.`
      : "No doc command check has been generated yet.",
  },
  {
    name: "本機 production smoke",
    status: smokeFailed === 0 && smokePassed > 0 ? "pass" : "fail",
    detail: `${smokePassed} passed, ${smokeFailed} failed. Course video range is covered by this smoke check.`,
  },
  {
    name: "Staging preflight",
    status: preflightFailures.length === 0 ? "pass" : "fail",
    detail: formatPreflightSummary(reports.preflight, preflightFailures),
  },
  {
    name: "Staging secrets",
    status: readinessFailures.length === 0 ? "pass" : "fail",
    detail: readinessFailures.length === 0
      ? "Required staging env checks are passing."
      : `Still blocked by ${readinessFailures.length} required env checks: ${readinessFailures.map(item => item.name.replace("Required env: ", "")).join(", ")}.`,
  },
  {
    name: "Render env blueprint",
    status: reports.renderEnv?.summary?.missingInRender === 0 && reports.renderEnv?.summary?.duplicateRenderKeys === 0 ? "pass" : "warn",
    detail: formatRenderEnvSummary(reports.renderEnv),
  },
  {
    name: "Report freshness",
    status: reports.reportFreshness?.summary?.fresh === reports.reportFreshness?.summary?.total ? "pass" : "fail",
    detail: reports.reportFreshness?.summary
      ? `${reports.reportFreshness.summary.fresh}/${reports.reportFreshness.summary.total} required reports are fresh within ${reports.reportFreshness.maxAgeHours} hours.`
      : "No report freshness check has been generated yet.",
  },
  {
    name: "Manus production data",
    status: "fail",
    detail: "Current .manus/db material is query logs, not a full production database dump. Full dump/media/delta is still required before real cutover.",
  },
  {
    name: "Production cutover gate",
    status: reports.cutoverGate?.decision === "GO" ? "pass" : "fail",
    detail: reports.cutoverGate
      ? `Latest cutover gate decision: ${reports.cutoverGate.decision}; ${reports.cutoverGate.summary.pass} pass, ${reports.cutoverGate.summary.fail} fail.`
      : "No production cutover gate report has been generated yet.",
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  repoRoot,
  reportsDir,
  git,
  summaries: {
    readiness: reports.readiness?.summary ?? null,
    preflight: reports.preflight?.summary ?? null,
    smoke: { passed: smokePassed, failed: smokeFailed },
    gitDeploy: reports.gitDeploy?.summary ?? null,
    sensitive: reports.sensitive?.summary ?? null,
    renderEnv: reports.renderEnv?.summary ?? null,
  },
  gates,
  blockers: [
    ...readinessFailures.map(item => item.name),
    ...preflightFailures.map(item => item.name),
    "Full Manus production database dump",
  ],
};

writeFile(options.output, renderHtml({ report, reports, readinessWarnings, externalByKind }));
writeFile(options.json, `${JSON.stringify(report, null, 2)}\n`);

console.log("Autolab migration dashboard");
console.log("===========================");
console.log(`Output: ${path.resolve(options.output)}`);
if (options.json) console.log(`JSON: ${path.resolve(options.json)}`);
console.log(`Gates: ${gates.filter(gate => gate.status === "pass").length} pass, ${gates.filter(gate => gate.status === "warn").length} warn, ${gates.filter(gate => gate.status === "fail").length} fail`);

function readReport(fileName) {
  const absolute = path.join(reportsDir, fileName);
  if (!fs.existsSync(absolute)) return null;
  try {
    return JSON.parse(fs.readFileSync(absolute, "utf8"));
  } catch {
    return null;
  }
}

function gitText(args) {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).trim();
  } catch {
    return "";
  }
}

function formatGitDeploySummary(data) {
  const summary = data?.summary;
  if (!summary) return "No latest Git deploy file report found.";
  return `${summary.tracked}/${summary.required} required files tracked by Git; ${summary.exists}/${summary.required} exist on disk.`;
}

function formatSensitiveSummary(data) {
  const summary = data?.summary;
  if (!summary) return "No latest sensitive-file report found.";
  return `${summary.ignored}/${summary.expectedIgnored} expected sensitive paths ignored; ${summary.trackedRiskFiles} risky files tracked.`;
}

function formatPreflightSummary(data, failures) {
  const summary = data?.summary;
  if (!summary) return "No latest preflight report found.";
  const failedText = failures.length > 0 ? ` Failed: ${failures.map(item => item.name).join(", ")}.` : "";
  return `${summary.passed} passed, ${summary.allowedFailures} allowed failures, ${summary.failed} failed.${failedText}`;
}

function formatRenderEnvSummary(data) {
  const summary = data?.summary;
  if (!summary) return "No latest Render env report found.";
  return `${summary.envKeys} env keys checked; ${summary.missingInRender} missing in render.yaml; ${summary.extraInRender} extra; ${summary.duplicateRenderKeys} duplicates.`;
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

function statusLabel(status) {
  if (status === "pass") return "PASS";
  if (status === "warn") return "WARN";
  return "BLOCKED";
}

function reportLink(label, fileName) {
  const absolute = path.join(reportsDir, fileName);
  return `<a href="${escapeHtml(absolute)}">${escapeHtml(label)}</a>`;
}

function renderHtml({ report, reports: loadedReports, readinessWarnings, externalByKind }) {
  const gateRows = report.gates
    .map(gate => `
      <tr>
        <td><span class="badge ${escapeHtml(gate.status)}">${statusLabel(gate.status)}</span></td>
        <td>${escapeHtml(gate.name)}</td>
        <td>${escapeHtml(gate.detail)}</td>
      </tr>`)
    .join("");

  const blockerRows = report.blockers
    .map(blocker => `<li>${escapeHtml(blocker)}</li>`)
    .join("");

  const warningRows = readinessWarnings
    .slice(0, 12)
    .map(item => `<li>${escapeHtml(item.name)} - ${escapeHtml(item.detail)}</li>`)
    .join("");

  const dependencyRows = externalByKind
    .map(item => `
      <tr>
        <td>${escapeHtml(item.kind)}</td>
        <td>${escapeHtml(item.count)}</td>
      </tr>`)
    .join("");

  const readinessSummary = loadedReports.readiness?.summary ?? { pass: 0, warn: 0, fail: 0 };
  const preflightSummary = loadedReports.preflight?.summary ?? { passed: 0, allowedFailures: 0, failed: 0 };
  const gitSummary = loadedReports.gitDeploy?.summary ?? { required: 0, exists: 0, tracked: 0 };
  const sensitiveSummary = loadedReports.sensitive?.summary ?? { expectedIgnored: 0, ignored: 0, trackedRiskFiles: 0 };

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autolab Migration Control Center</title>
  <style>
    body { margin: 0; background: #f6f8fb; color: #182033; font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", "Segoe UI", sans-serif; line-height: 1.65; }
    main { max-width: 1180px; margin: 0 auto; padding: 44px 24px 64px; }
    h1 { margin: 0 0 8px; font-size: 32px; line-height: 1.2; }
    h2 { margin-top: 34px; padding-top: 18px; border-top: 1px solid #dce4f0; font-size: 21px; }
    a { color: #155eef; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    pre { overflow: auto; border-radius: 8px; background: #111827; color: #e5e7eb; padding: 16px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e8edf5; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef2f8; font-weight: 700; }
    ul { padding-left: 1.2em; }
    li { margin: 5px 0; }
    .lead { color: #637084; font-size: 17px; }
    .notice { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 16px; margin: 22px 0; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 18px 0 8px; }
    .card { background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; padding: 14px 16px; }
    .num { display: block; font-size: 26px; font-weight: 800; line-height: 1.15; }
    .meta { color: #657185; font-size: 13px; }
    .badge { display: inline-flex; border-radius: 999px; padding: 3px 8px; font-size: 12px; font-weight: 800; }
    .pass { background: #dcfce7; color: #166534; }
    .warn { background: #fef3c7; color: #92400e; }
    .fail { background: #fee2e2; color: #991b1b; }
    @media (max-width: 960px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <h1>Autolab Migration Control Center</h1>
    <p class="lead">本頁由 <code>npm run staging:dashboard</code> 從最新報告重新產生，用來追蹤 Autolab 從 Manus 搬到自有 staging/production 的真實狀態。</p>

    <div class="notice">
      <strong>安全原則：</strong>目前只做本機與 staging 準備；不覆蓋 Manus production、不改正式 DNS、不把 <code>autolab.cloud</code> 指到未驗證環境。
    </div>

    <div class="grid">
      <div class="card"><span class="num">${readinessSummary.pass}/${readinessSummary.warn}/${readinessSummary.fail}</span><span class="meta">readiness pass/warn/fail</span></div>
      <div class="card"><span class="num">${preflightSummary.passed}/${preflightSummary.failed}</span><span class="meta">preflight passed/failed</span></div>
      <div class="card"><span class="num">${report.summaries.smoke.passed}/${report.summaries.smoke.failed}</span><span class="meta">local smoke passed/failed</span></div>
      <div class="card"><span class="num">${gitSummary.tracked}/${gitSummary.required}</span><span class="meta">Git deploy files tracked</span></div>
      <div class="card"><span class="num">${sensitiveSummary.trackedRiskFiles}</span><span class="meta">risky sensitive files tracked</span></div>
      <div class="card"><span class="num">${report.git.branch || "(unknown)"}</span><span class="meta">current branch</span></div>
    </div>

    <h2>Migration Gates</h2>
    <table>
      <thead><tr><th>Status</th><th>Gate</th><th>Current Detail</th></tr></thead>
      <tbody>${gateRows}</tbody>
    </table>

    <h2>Current Blockers</h2>
    <ul>${blockerRows}</ul>

    <h2>Warnings To Review</h2>
    <ul>${warningRows || "<li>No readiness warnings in latest report.</li>"}</ul>

    <h2>External Dependency Scan</h2>
    <table>
      <thead><tr><th>Kind</th><th>Count</th></tr></thead>
      <tbody>${dependencyRows}</tbody>
    </table>

    <h2>Reports</h2>
    <div class="grid">
      <div class="card"><strong>Preflight</strong>${reportLink("Open report", "autolab-staging-preflight.html")}</div>
      <div class="card"><strong>Local smoke</strong>${reportLink("Open report", "autolab-staging-smoke-local.html")}</div>
      <div class="card"><strong>Readiness</strong>${reportLink("Open report", "autolab-staging-readiness.html")}</div>
      <div class="card"><strong>Git deploy files</strong>${reportLink("Open report", "autolab-git-deploy-files.html")}</div>
      <div class="card"><strong>Doc command check</strong>${reportLink("Open report", "autolab-doc-command-check.html")}</div>
      <div class="card"><strong>Sensitive file guard</strong>${reportLink("Open report", "autolab-sensitive-file-guard.html")}</div>
      <div class="card"><strong>Render env check</strong>${reportLink("Open report", "autolab-render-env-check.html")}</div>
      <div class="card"><strong>Report freshness</strong>${reportLink("Open report", "autolab-report-freshness.html")}</div>
      <div class="card"><strong>Production cutover gate</strong>${reportLink("Open report", "autolab-production-cutover-gate.html")}</div>
      <div class="card"><strong>External dependencies</strong>${reportLink("Open report", "autolab-external-dependencies.html")}</div>
      <div class="card"><strong>Manus dump inspection</strong>${reportLink("Open report", "autolab-manus-dump-inspection-current.html")}</div>
    </div>

    <h2>Next Safe Steps</h2>
    <table>
      <thead><tr><th>Order</th><th>Action</th><th>Done When</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>取得真的 Neon staging <code>DATABASE_URL</code>，不是 placeholder，也不是 production。</td><td><code>npm run staging:check-db-target -- --env-file=.env.staging</code> passes.</td></tr>
        <tr><td>2</td><td>建立 Clerk test app 並填入 <code>sk_test_</code> / <code>pk_test_</code> 與 <code>ADMIN_USER_IDS</code>。</td><td>Readiness required Clerk checks pass.</td></tr>
        <tr><td>3</td><td>建立 Turnstile staging site key/secret。</td><td>Readiness Turnstile checks pass.</td></tr>
        <tr><td>4</td><td>完整跑 preflight，再部署 preview URL。</td><td>Only production cutover remains blocked.</td></tr>
        <tr><td>5</td><td>取得 Manus 完整 production DB dump、media、delta window。</td><td>Staging import and sampling reports pass.</td></tr>
      </tbody>
    </table>

    <h2>Commands</h2>
    <pre>npm run staging:dashboard -- --json=/Users/huangjingfeng/Desktop/專案/_reports/autolab-migration-dashboard.json
npm run staging:readiness -- --env-file=.env.staging --html=/Users/huangjingfeng/Desktop/專案/_reports/autolab-staging-readiness.html --json=/Users/huangjingfeng/Desktop/專案/_reports/autolab-staging-readiness.json
npm run staging:preflight -- --env-file=.env.staging --base-url=http://localhost:3131
npm run staging:check-db-target -- --env-file=.env.staging
npm run staging:check-sensitive-files -- --html=/Users/huangjingfeng/Desktop/專案/_reports/autolab-sensitive-file-guard.html --json=/Users/huangjingfeng/Desktop/專案/_reports/autolab-sensitive-file-guard.json</pre>

    <p class="meta">Generated at ${escapeHtml(report.generatedAt)} from <code>${escapeHtml(report.reportsDir)}</code>.</p>
  </main>
</body>
</html>
`;
}
