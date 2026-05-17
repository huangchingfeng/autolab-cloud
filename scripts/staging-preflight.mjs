#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";

const options = {
  reportsDir: "/Users/huangjingfeng/Desktop/專案/_reports",
  envFile: fs.existsSync(".env.staging") ? ".env.staging" : ".env.staging.example",
  skipTests: false,
  skipBuild: false,
  skipSmoke: false,
  allowEnvFailures: false,
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--reports-dir=")) options.reportsDir = arg.slice("--reports-dir=".length);
  if (arg.startsWith("--env-file=")) options.envFile = arg.slice("--env-file=".length);
  if (arg === "--skip-tests") options.skipTests = true;
  if (arg === "--skip-build") options.skipBuild = true;
  if (arg === "--skip-smoke") options.skipSmoke = true;
  if (arg === "--allow-env-failures") options.allowEnvFailures = true;
}

const repoRoot = process.cwd();
const reportsDir = path.resolve(options.reportsDir);
fs.mkdirSync(reportsDir, { recursive: true });

const steps = [
  {
    name: "Mirror CloudFront assets",
    command: ["npm", ["run", "assets:mirror-cloudfront"]],
  },
  {
    name: "Check local static assets",
    command: ["npm", ["run", "assets:check-static"]],
  },
  {
    name: "Sensitive file guard",
    command: [
      "npm",
      [
        "run",
        "staging:check-sensitive-files",
        "--",
        `--html=${path.join(reportsDir, "autolab-sensitive-file-guard.html")}`,
        `--json=${path.join(reportsDir, "autolab-sensitive-file-guard.json")}`,
      ],
    ],
  },
  {
    name: "Git-backed deploy file check",
    command: [
      "npm",
      [
        "run",
        "staging:check-git-deploy-files",
        "--",
        `--html=${path.join(reportsDir, "autolab-git-deploy-files.html")}`,
        `--json=${path.join(reportsDir, "autolab-git-deploy-files.json")}`,
      ],
    ],
  },
  {
    name: "Render env blueprint check",
    command: [
      "npm",
      [
        "run",
        "staging:check-render-env",
        "--",
        `--env-file=${options.envFile}`,
        `--html=${path.join(reportsDir, "autolab-render-env-check.html")}`,
        `--json=${path.join(reportsDir, "autolab-render-env-check.json")}`,
      ],
    ],
  },
  {
    name: "Audit external dependencies",
    command: [
      "npm",
      [
        "run",
        "audit:external-deps",
        "--",
        `--html=${path.join(reportsDir, "autolab-external-dependencies.html")}`,
        `--json=${path.join(reportsDir, "autolab-external-dependencies.json")}`,
      ],
    ],
  },
  {
    name: "Staging readiness report",
    allowFailure: options.allowEnvFailures,
    command: [
      "npm",
      [
        "run",
        "staging:readiness",
        "--",
        `--env-file=${options.envFile}`,
        `--html=${path.join(reportsDir, "autolab-staging-readiness.html")}`,
        `--json=${path.join(reportsDir, "autolab-staging-readiness.json")}`,
      ],
    ],
  },
  {
    name: "Staging DB target safety check",
    allowFailure: options.allowEnvFailures,
    command: ["npm", ["run", "staging:check-db-target", "--", `--env-file=${options.envFile}`]],
  },
  {
    name: "TypeScript check",
    command: ["npm", ["run", "check", "--", "--pretty", "false"]],
  },
  ...(!options.skipTests
    ? [
        {
          name: "Unit tests",
          command: ["npm", ["test"]],
        },
      ]
    : []),
  ...(!options.skipBuild
    ? [
        {
          name: "Production build",
          command: ["npm", ["run", "build"]],
        },
      ]
    : []),
  ...(!options.skipBuild && !options.skipSmoke
    ? [
        {
          name: "Local production smoke",
          kind: "local-smoke",
        },
      ]
    : []),
];

const results = [];
for (const step of steps) {
  if (step.kind === "local-smoke") {
    results.push(await runLocalSmokeStep(step));
  } else {
    results.push(runCommandStep(step));
  }
}

const failed = results.filter(result => !result.ok);
const report = {
  generatedAt: new Date().toISOString(),
  repoRoot,
  envFile: path.resolve(options.envFile),
  reportsDir,
  summary: {
    passed: results.filter(result => result.ok && result.exitCode === 0).length,
    allowedFailures: results.filter(result => result.ok && result.exitCode !== 0).length,
    failed: failed.length,
  },
  results,
};

const jsonPath = path.join(reportsDir, "autolab-staging-preflight.json");
const htmlPath = path.join(reportsDir, "autolab-staging-preflight.html");
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(htmlPath, renderHtml(report));

console.log("");
console.log(`Preflight: ${report.summary.passed} passed, ${report.summary.allowedFailures} allowed failures, ${report.summary.failed} failed`);
console.log(`Wrote ${htmlPath}`);
console.log(`Wrote ${jsonPath}`);

if (failed.length > 0) {
  process.exit(1);
}

function runCommandStep(step) {
  const startedAt = Date.now();
  console.log(`\n==> ${step.name}`);
  console.log(`$ ${step.command[0]} ${step.command[1].join(" ")}`);

  const result = spawnSync(step.command[0], step.command[1], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const exitCode = result.status ?? 1;
  const ok = exitCode === 0 || Boolean(step.allowFailure);
  return {
    name: step.name,
    command: `${step.command[0]} ${step.command[1].join(" ")}`,
    exitCode,
    allowedFailure: Boolean(step.allowFailure),
    ok,
    durationMs: Date.now() - startedAt,
    stdoutTail: tail(result.stdout),
    stderrTail: tail(result.stderr),
  };
}

async function runLocalSmokeStep(step) {
  const startedAt = Date.now();
  const preferredPort = process.env.STAGING_PREFLIGHT_PORT || "3131";
  const smokeJson = path.join(reportsDir, "autolab-staging-smoke-local.json");
  const smokeHtml = path.join(reportsDir, "autolab-staging-smoke-local.html");
  const command = `PORT=${preferredPort} npm run start && npm run staging:smoke`;
  let stdout = "";
  let stderr = "";
  let detectedPort = "";

  console.log(`\n==> ${step.name}`);
  console.log(`$ ${command}`);

  const server = spawn("npm", ["run", "start"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: preferredPort,
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://smoke:smoke@127.0.0.1:5432/smoke",
      JWT_SECRET: process.env.JWT_SECRET || "smoke",
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || "smoke",
      CLERK_PUBLISHABLE_KEY: "",
      VITE_APP_URL: "",
      SITEMAP_SKIP_DYNAMIC: "true",
    },
  });

  server.stdout.on("data", chunk => {
    const text = chunk.toString();
    stdout += text;
    process.stdout.write(text);
    const match = stdout.match(/http:\/\/localhost:(\d+)\//);
    if (match) detectedPort = match[1];
  });

  server.stderr.on("data", chunk => {
    const text = chunk.toString();
    stderr += text;
    process.stderr.write(text);
  });

  try {
    await waitForServer(server, () => detectedPort ? `http://localhost:${detectedPort}/api/health` : "");

    const baseUrl = `http://localhost:${detectedPort}`;
    const smokeArgs = [
      "run",
      "staging:smoke",
      "--",
      `--base-url=${baseUrl}`,
      `--json=${smokeJson}`,
      `--html=${smokeHtml}`,
    ];
    console.log(`$ npm ${smokeArgs.join(" ")}`);

    const smokeResult = spawnSync("npm", smokeArgs, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (smokeResult.stdout) process.stdout.write(smokeResult.stdout);
    if (smokeResult.stderr) process.stderr.write(smokeResult.stderr);
    stdout += smokeResult.stdout || "";
    stderr += smokeResult.stderr || "";

    const exitCode = smokeResult.status ?? 1;
    return {
      name: step.name,
      command,
      exitCode,
      allowedFailure: false,
      ok: exitCode === 0,
      durationMs: Date.now() - startedAt,
      stdoutTail: tail(stdout),
      stderrTail: tail(stderr),
    };
  } catch (error) {
    stderr += `\n${error.message}`;
    return {
      name: step.name,
      command,
      exitCode: 1,
      allowedFailure: false,
      ok: false,
      durationMs: Date.now() - startedAt,
      stdoutTail: tail(stdout),
      stderrTail: tail(stderr),
    };
  } finally {
    await stopProcess(server);
  }
}

async function waitForServer(server, getHealthUrl) {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Local smoke server exited before it was ready with code ${server.exitCode}`);
    }

    const healthUrl = getHealthUrl();
    if (healthUrl) {
      try {
        const response = await fetch(healthUrl, { signal: AbortSignal.timeout(1000) });
        if (response.ok) return;
      } catch {
        // Keep polling until the server accepts requests or the timeout expires.
      }
    }

    await new Promise(resolve => setTimeout(resolve, 250));
  }

  throw new Error("Timed out waiting for local smoke server");
}

async function stopProcess(child) {
  if (child.exitCode !== null || child.killed) return;

  child.kill("SIGTERM");
  await new Promise(resolve => {
    const timeout = setTimeout(() => {
      if (child.exitCode === null && !child.killed) child.kill("SIGKILL");
      resolve();
    }, 5000);

    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function tail(value = "", maxLines = 16) {
  const lines = value.trim().split(/\r?\n/).filter(Boolean);
  return lines.slice(-maxLines).join("\n");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtml(data) {
  const rows = data.results
    .map(result => `
      <tr>
        <td><span class="badge ${result.ok ? result.exitCode === 0 ? "pass" : "warn" : "fail"}">${result.ok ? result.exitCode === 0 ? "PASS" : "ALLOWED" : "FAIL"}</span></td>
        <td>${escapeHtml(result.name)}</td>
        <td><code>${escapeHtml(result.command)}</code></td>
        <td>${result.exitCode}</td>
        <td>${result.durationMs}ms</td>
      </tr>
      ${result.stderrTail ? `<tr><td></td><td colspan="4"><pre>${escapeHtml(result.stderrTail)}</pre></td></tr>` : ""}`)
    .join("");

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autolab Staging Preflight</title>
  <style>
    body { margin: 0; background: #f7f8fb; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; }
    main { max-width: 1180px; margin: 0 auto; padding: 40px 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    .meta { color: #647085; }
    .summary { display: flex; gap: 12px; margin: 22px 0; flex-wrap: wrap; }
    .card { background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; padding: 14px 16px; min-width: 130px; }
    .num { display: block; font-size: 26px; font-weight: 800; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e8edf5; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef2f8; font-weight: 700; }
    code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    pre { white-space: pre-wrap; margin: 0; background: #111827; color: #e5e7eb; padding: 12px; border-radius: 6px; }
    .badge { display: inline-flex; border-radius: 999px; padding: 3px 8px; font-weight: 700; font-size: 12px; }
    .pass { background: #dcfce7; color: #166534; }
    .warn { background: #fef3c7; color: #92400e; }
    .fail { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <main>
    <h1>Autolab Staging Preflight</h1>
    <p class="meta">Generated at ${escapeHtml(data.generatedAt)} · env file <code>${escapeHtml(data.envFile)}</code></p>
    <div class="summary">
      <div class="card"><span class="num">${data.summary.passed}</span>Passed</div>
      <div class="card"><span class="num">${data.summary.allowedFailures}</span>Allowed</div>
      <div class="card"><span class="num">${data.summary.failed}</span>Failed</div>
    </div>
    <table>
      <thead><tr><th>Status</th><th>Step</th><th>Command</th><th>Exit</th><th>Time</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
</body>
</html>`;
}
