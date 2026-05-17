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

const expectedIgnoredPaths = [
  ".env",
  ".env.staging",
  "_imports/manus-production-dump/autolab.sql.gz",
  "_reports/autolab-staging-readiness.json",
  "manus-production-dump/autolab.dump",
  "manus-dump/autolab.backup.gz",
  "db-dumps/autolab.pgdump",
  "database-dumps/autolab.psql",
  "production-dump/autolab.dump.zip",
  "client/public/course-videos/sample.mov",
  "client/public/images/manus-event/sample.png",
  "client/public/downloads/manus-ai-agent-summary.pdf",
];

const trackedRiskRules = [
  {
    name: "Environment files",
    test: file => /^\.env(\.|$)/.test(file) && ![".env.example", ".env.staging.example"].includes(file),
  },
  {
    name: "Database dump files",
    test: file => /\.(dump|pgdump|backup|psql)$/.test(file)
      || /\.(sql|dump|backup|db|sqlite|sqlite3)\.(gz|zip|tar|zst|xz)$/.test(file),
  },
  {
    name: "Private import/report folders",
    test: file => file.startsWith("_imports/") || file.startsWith("_reports/"),
  },
];

const gitIgnore = runGit(["check-ignore", "--stdin"], `${expectedIgnoredPaths.join("\n")}\n`);
const ignoredSet = gitIgnore.ok
  ? new Set((gitIgnore.stdout || "").trim().split(/\r?\n/).filter(Boolean))
  : new Set(expectedIgnoredPaths.filter(matchesProjectIgnore));
const ignoreChecks = expectedIgnoredPaths.map(file => ({
  file,
  ignored: ignoredSet.has(file),
}));

const tracked = runGit(["ls-files"], "");
const trackedFiles = tracked.ok ? tracked.stdout.trim().split(/\r?\n/).filter(Boolean) : [];
const trackedFindings = [];
for (const file of trackedFiles) {
  for (const rule of trackedRiskRules) {
    if (rule.test(file)) trackedFindings.push({ file, rule: rule.name });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  repoRoot,
  git: {
    checkIgnoreOk: gitIgnore.ok,
    checkIgnoreError: gitIgnore.error,
    checkIgnoreMode: gitIgnore.ok ? "git" : "gitignore-fallback",
    lsFilesOk: tracked.ok,
    lsFilesError: tracked.error,
  },
  summary: {
    expectedIgnored: ignoreChecks.length,
    ignored: ignoreChecks.filter(check => check.ignored).length,
    trackedRiskFiles: trackedFindings.length,
  },
  ignoreChecks,
  trackedFindings,
};

writeOutput(options.json, `${JSON.stringify(report, null, 2)}\n`);
writeOutput(options.html, renderHtml(report));

console.log("Autolab sensitive file guard");
console.log("============================");
console.log(`Expected ignored paths: ${report.summary.ignored}/${report.summary.expectedIgnored}`);
console.log(`Tracked risky files: ${report.summary.trackedRiskFiles}`);
if (options.html) console.log(`Wrote ${path.resolve(options.html)}`);
if (options.json) console.log(`Wrote ${path.resolve(options.json)}`);

const missingIgnored = ignoreChecks.filter(check => !check.ignored);
if (!tracked.ok || missingIgnored.length > 0 || trackedFindings.length > 0) {
  if (!gitIgnore.ok) console.error(`git check-ignore failed; used .gitignore fallback: ${gitIgnore.error}`);
  if (!tracked.ok) console.error(`git ls-files failed: ${tracked.error}`);
  for (const item of missingIgnored) console.error(`Not ignored: ${item.file}`);
  for (const item of trackedFindings) console.error(`Tracked risky file: ${item.file} (${item.rule})`);
  process.exit(1);
}

function runGit(args, input) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    input,
    encoding: "utf8",
    timeout: 5000,
  });

  if (result.error) {
    return { ok: false, stdout: result.stdout || "", error: result.error.message };
  }

  if (result.status !== 0 && !(args[0] === "check-ignore" && result.status === 1)) {
    return { ok: false, stdout: result.stdout || "", error: result.stderr || `exit ${result.status}` };
  }

  return { ok: true, stdout: result.stdout || "", error: "" };
}

function matchesProjectIgnore(file) {
  const gitignorePath = path.resolve(repoRoot, ".gitignore");
  if (!fs.existsSync(gitignorePath)) return false;

  const patterns = fs.readFileSync(gitignorePath, "utf8")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#") && !line.startsWith("!"));

  return patterns.some(pattern => matchesIgnorePattern(file, pattern));
}

function matchesIgnorePattern(file, pattern) {
  const normalizedFile = file.replaceAll("\\", "/");
  const normalizedPattern = pattern.replaceAll("\\", "/");
  const basename = path.posix.basename(normalizedFile);

  if (normalizedPattern.endsWith("/")) {
    const directory = normalizedPattern.slice(0, -1);
    return normalizedFile === directory || normalizedFile.startsWith(`${directory}/`);
  }

  if (normalizedPattern.startsWith("**/")) {
    return matchesIgnorePattern(normalizedFile, normalizedPattern.slice(3))
      || normalizedFile.includes(`/${normalizedPattern.slice(3)}`);
  }

  if (normalizedPattern.startsWith("*.")) {
    return basename.endsWith(normalizedPattern.slice(1));
  }

  if (normalizedPattern.startsWith("*")) {
    return basename.endsWith(normalizedPattern.slice(1));
  }

  if (normalizedPattern.includes("/")) {
    return normalizedFile === normalizedPattern;
  }

  return basename === normalizedPattern || normalizedFile.startsWith(`${normalizedPattern}/`);
}

function writeOutput(target, content) {
  if (!target) return;
  fs.mkdirSync(path.dirname(path.resolve(target)), { recursive: true });
  fs.writeFileSync(path.resolve(target), content);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderHtml(report) {
  const statusClass = report.summary.trackedRiskFiles === 0 && report.summary.ignored === report.summary.expectedIgnored
    ? "pass"
    : "fail";
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autolab Sensitive File Guard</title>
  <style>
    body { margin: 0; background: #f7f8fb; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; line-height: 1.65; }
    main { max-width: 1120px; margin: 0 auto; padding: 44px 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    h2 { margin-top: 32px; padding-top: 18px; border-top: 1px solid #dce4f0; font-size: 20px; }
    .lead { color: #647085; }
    .notice { border-radius: 8px; padding: 14px 16px; margin: 22px 0; }
    .pass { background: #ecfdf5; border: 1px solid #bbf7d0; color: #166534; }
    .fail { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e8edf5; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef2f8; font-weight: 700; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  </style>
</head>
<body>
  <main>
    <h1>Autolab Sensitive File Guard</h1>
    <p class="lead">檢查 migration dump、報表、環境檔與大型鏡像資產是否被 git 忽略，避免正式資料或密鑰被誤提交。</p>
    <div class="notice ${statusClass}">
      <strong>Summary:</strong>
      ignored ${report.summary.ignored}/${report.summary.expectedIgnored};
      tracked risky files ${report.summary.trackedRiskFiles}.
    </div>

    <h2>Expected Ignored Paths</h2>
    <table>
      <thead><tr><th>Path</th><th>Status</th></tr></thead>
      <tbody>
        ${report.ignoreChecks.map(check => `<tr><td><code>${escapeHtml(check.file)}</code></td><td>${check.ignored ? "ignored" : "not ignored"}</td></tr>`).join("\n        ")}
      </tbody>
    </table>

    <h2>Tracked Risk Findings</h2>
    <table>
      <thead><tr><th>File</th><th>Rule</th></tr></thead>
      <tbody>
        ${report.trackedFindings.length
          ? report.trackedFindings.map(item => `<tr><td><code>${escapeHtml(item.file)}</code></td><td>${escapeHtml(item.rule)}</td></tr>`).join("\n        ")
          : `<tr><td colspan="2">No tracked risky files found.</td></tr>`}
      </tbody>
    </table>
  </main>
</body>
</html>
`;
}
