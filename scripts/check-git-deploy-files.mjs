#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const options = {
  json: "",
  html: "",
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--json=")) options.json = arg.slice("--json=".length);
  if (arg.startsWith("--html=")) options.html = arg.slice("--html=".length);
}

const repoRoot = process.cwd();

const requiredDeployFiles = [
  ".gitignore",
  ".env.staging.example",
  "package.json",
  "package-lock.json",
  "render.yaml",
  "tsconfig.json",
  "vite.config.ts",
  "vitest.config.ts",
  "drizzle/schema.ts",
  "server/db.ts",
  "server/_core/bniEventEmail.ts",
  "server/_core/types/aws-s3-presigner.d.ts",
  "server/_core/types/aws-sdk.d.ts",
  "server/_core/types/clerk-express.d.ts",
  "server/_core/types/date-fns-locale.d.ts",
  "server/_core/types/date-fns.d.ts",
  "server/_core/types/react-day-picker.d.ts",
  "server/_core/types/react-resizable-panels.d.ts",
  "server/_core/types/recharts.d.ts",
  "server/_core/types/streamdown.d.ts",
  "server/routes/sitemap.ts",
  "server/sitemap.test.ts",
  "client/src/index.css",
  "client/src/App.tsx",
  "client/src/lib/lucide-react-shim.js",
  "client/src/components/AdminLayout.tsx",
  "client/src/components/Header.tsx",
  "client/src/components/AISuperSalesRegistrationForm.tsx",
  "client/src/pages/AISuperSales.tsx",
  "client/src/pages/CorporateTraining.tsx",
  "client/src/pages/admin/AISuperSalesRegistrations.tsx",
  "client/src/pages/admin/CorporateInquiries.tsx",
  "scripts/audit-external-dependencies.mjs",
  "scripts/build-frontend.mjs",
  "scripts/check-doc-commands.mjs",
  "scripts/check-git-deploy-files.mjs",
  "scripts/check-report-freshness.mjs",
  "scripts/check-render-env.mjs",
  "scripts/check-static-assets.mjs",
  "scripts/check-sensitive-files.mjs",
  "scripts/import-manus-data.mjs",
  "scripts/init-staging-env.mjs",
  "scripts/inspect-manus-dump.mjs",
  "scripts/manus-db-inventory.mjs",
  "scripts/mirror-cloudfront-assets.mjs",
  "scripts/prepare-manus-data.mjs",
  "scripts/production-cutover-gate.mjs",
  "scripts/push-staging-schema.mjs",
  "scripts/render-migration-dashboard.mjs",
  "scripts/seed-staging-sample-data.mjs",
  "scripts/smoke-staging.mjs",
  "scripts/staging-preflight.mjs",
  "scripts/staging-readiness-report.mjs",
  "scripts/validate-db-target.mjs",
  "scripts/validate-staging-env.mjs",
  "docs/autolab-expert-review.html",
  "docs/autolab-manus-data-migration-plan.html",
  "docs/autolab-manus-data-request.html",
  "docs/autolab-migration-index.html",
  "docs/autolab-preview-qa-checklist.html",
  "docs/autolab-production-cutover-checklist.html",
  "docs/autolab-staging-runbook.html",
  "docs/autolab-staging-secrets-checklist.html",
  "docs/autolab-staging-services-setup.html",
  "docs/autolab-unblock-plan.html",
];

const trackedResult = spawnSync("git", ["ls-files", "--", ...requiredDeployFiles], {
  cwd: repoRoot,
  encoding: "utf8",
  timeout: 5000,
});

const trackedSet = new Set((trackedResult.stdout || "").trim().split(/\r?\n/).filter(Boolean));
const rows = requiredDeployFiles.map(file => ({
  file,
  exists: fs.existsSync(path.resolve(repoRoot, file)),
  tracked: trackedSet.has(file),
}));

const report = {
  generatedAt: new Date().toISOString(),
  repoRoot,
  gitOk: !trackedResult.error && trackedResult.status === 0,
  gitError: trackedResult.error?.message || trackedResult.stderr || "",
  summary: {
    required: rows.length,
    exists: rows.filter(row => row.exists).length,
    tracked: rows.filter(row => row.tracked).length,
    missingFromDisk: rows.filter(row => !row.exists).map(row => row.file),
    missingFromGit: rows.filter(row => row.exists && !row.tracked).map(row => row.file),
  },
  rows,
};

writeFile(options.json, `${JSON.stringify(report, null, 2)}\n`);
writeFile(options.html, renderHtml(report));

console.log("Autolab Git-backed deploy file check");
console.log("====================================");
console.log(`Required files: ${report.summary.required}`);
console.log(`Exist on disk: ${report.summary.exists}/${report.summary.required}`);
console.log(`Tracked by Git: ${report.summary.tracked}/${report.summary.required}`);
if (options.html) console.log(`Wrote ${path.resolve(options.html)}`);
if (options.json) console.log(`Wrote ${path.resolve(options.json)}`);

if (!report.gitOk || report.summary.missingFromDisk.length > 0 || report.summary.missingFromGit.length > 0) {
  if (!report.gitOk) console.error(`git ls-files failed: ${report.gitError}`);
  for (const file of report.summary.missingFromDisk) console.error(`Missing from disk: ${file}`);
  for (const file of report.summary.missingFromGit) console.error(`Missing from Git tracking: ${file}`);
  process.exit(1);
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
  const tableRows = data.rows
    .map(row => `
      <tr>
        <td><code>${escapeHtml(row.file)}</code></td>
        <td>${row.exists ? "yes" : "no"}</td>
        <td>${row.tracked ? "yes" : "no"}</td>
      </tr>`)
    .join("");

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autolab Git Deploy Files</title>
  <style>
    body { margin: 0; background: #f7f8fb; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; line-height: 1.65; }
    main { max-width: 1120px; margin: 0 auto; padding: 44px 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    .notice { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 16px; margin: 22px 0; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e8edf5; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef2f8; font-weight: 700; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  </style>
</head>
<body>
  <main>
    <h1>Autolab Git Deploy Files</h1>
    <div class="notice">
      Required: ${data.summary.required};
      exists: ${data.summary.exists};
      tracked: ${data.summary.tracked}.
    </div>
    <table>
      <thead><tr><th>File</th><th>Exists</th><th>Tracked</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </main>
</body>
</html>
`;
}
