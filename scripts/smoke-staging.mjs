#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const options = {
  baseUrl: process.env.STAGING_BASE_URL || "http://localhost:3131",
  json: "",
  html: "",
  timeoutMs: 15000,
  allowProductionDomain: false,
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--base-url=")) options.baseUrl = arg.slice("--base-url=".length);
  if (arg.startsWith("--json=")) options.json = arg.slice("--json=".length);
  if (arg.startsWith("--html=")) options.html = arg.slice("--html=".length);
  if (arg.startsWith("--timeout-ms=")) options.timeoutMs = Number(arg.slice("--timeout-ms=".length));
  if (arg === "--allow-production-domain") options.allowProductionDomain = true;
}

const baseUrl = options.baseUrl.replace(/\/+$/, "");
const baseHost = new URL(baseUrl).hostname.toLowerCase();
if (!options.allowProductionDomain && (baseHost === "autolab.cloud" || baseHost === "www.autolab.cloud")) {
  console.error("Refusing to smoke test the current production domain. Use a staging/preview URL, or add --allow-production-domain for a deliberate read-only check.");
  process.exit(1);
}

const checks = [
  {
    name: "API health",
    path: "/api/health",
    expectStatus: 200,
    expectContentType: "application/json",
  },
  {
    name: "tRPC public auth state",
    path: "/api/trpc/auth.me?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D",
    expectStatus: 200,
    expectText: '"json":null',
  },
  {
    name: "Sitemap",
    path: "/sitemap.xml",
    expectStatus: 200,
    expectContentType: "application/xml",
    expectText: "/ai-super-sales",
  },
  {
    name: "Robots",
    path: "/robots.txt",
    expectStatus: 200,
    expectContentType: "text/plain",
    expectText: "Sitemap:",
  },
  { name: "Home SPA fallback", path: "/", expectStatus: 200, expectContentType: "text/html" },
  { name: "AI Super Sales route", path: "/ai-super-sales", expectStatus: 200, expectContentType: "text/html" },
  { name: "Corporate training route", path: "/corporate-training", expectStatus: 200, expectContentType: "text/html" },
  { name: "Topics route", path: "/topics", expectStatus: 200, expectContentType: "text/html" },
  { name: "Admin AI Super Sales route", path: "/admin/ai-super-sales-registrations", expectStatus: 200, expectContentType: "text/html" },
  { name: "Admin corporate inquiries route", path: "/admin/corporate-inquiries", expectStatus: 200, expectContentType: "text/html" },
  {
    name: "BNI local step image",
    path: "/images/manus-event/content-alchemy.png",
    expectStatus: 200,
    expectContentType: "image/png",
    minBytes: 500000,
  },
  {
    name: "NotebookLM local image",
    path: "/images/notebooklm-course/notebooklm-2026-ai-upgrade.png",
    expectStatus: 200,
    expectContentType: "image/png",
    minBytes: 2000000,
  },
  {
    name: "Download PDF",
    path: "/downloads/gemini-ai-strategy-guide.pdf",
    expectStatus: 200,
    expectContentType: "application/pdf",
    minBytes: 10000000,
  },
  {
    name: "Course video range",
    path: "/course-videos/ai-tools-practice.mov",
    method: "GET",
    headers: { Range: "bytes=0-1023" },
    expectStatus: 206,
    expectContentType: "video/quicktime",
    minBytes: 1024,
  },
];

async function runCheck(check) {
  const startedAt = Date.now();
  const url = `${baseUrl}${check.path}`;
  const result = {
    name: check.name,
    url,
    ok: false,
    status: null,
    contentType: "",
    bytes: 0,
    durationMs: 0,
    error: "",
  };

  try {
    const response = await fetch(url, {
      method: check.method || "GET",
      headers: check.headers,
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    result.status = response.status;
    result.contentType = response.headers.get("content-type") || "";
    const body = Buffer.from(await response.arrayBuffer());
    result.bytes = body.byteLength;
    result.durationMs = Date.now() - startedAt;

    const statusOk = response.status === check.expectStatus;
    const contentTypeOk = !check.expectContentType || result.contentType.includes(check.expectContentType);
    const bytesOk = !check.minBytes || result.bytes >= check.minBytes;
    const textOk = !check.expectText || body.toString("utf8").includes(check.expectText);
    result.ok = statusOk && contentTypeOk && bytesOk && textOk;

    if (!result.ok) {
      result.error = [
        statusOk ? "" : `expected status ${check.expectStatus}`,
        contentTypeOk ? "" : `expected content-type ${check.expectContentType}`,
        bytesOk ? "" : `expected at least ${check.minBytes} bytes`,
        textOk ? "" : `expected response text ${check.expectText}`,
      ].filter(Boolean).join("; ");
    }
  } catch (error) {
    result.durationMs = Date.now() - startedAt;
    result.error = error.message;
  }

  return result;
}

const results = [];
for (const check of checks) {
  const result = await runCheck(check);
  results.push(result);
  console.log(`${result.ok ? "OK" : "!!"} ${result.name}: ${result.status ?? "ERR"} ${result.contentType || ""} ${result.bytes} bytes (${result.durationMs}ms)`);
  if (!result.ok) console.log(`   ${result.error}`);
}

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  results,
  passed: results.filter(result => result.ok).length,
  failed: results.filter(result => !result.ok).length,
};

function writeFile(target, contents) {
  if (!target) return;
  const absolute = path.resolve(process.cwd(), target);
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
  const rows = data.results
    .map(result => `
      <tr>
        <td><span class="badge ${result.ok ? "ok" : "fail"}">${result.ok ? "OK" : "FAIL"}</span></td>
        <td>${escapeHtml(result.name)}</td>
        <td>${escapeHtml(result.status ?? "ERR")}</td>
        <td>${escapeHtml(result.contentType)}</td>
        <td>${result.bytes}</td>
        <td>${result.durationMs}ms</td>
        <td><a href="${escapeHtml(result.url)}">${escapeHtml(result.url)}</a>${result.error ? `<br><strong>${escapeHtml(result.error)}</strong>` : ""}</td>
      </tr>`)
    .join("");

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autolab Staging Smoke Test</title>
  <style>
    body { margin: 0; background: #f7f8fb; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; }
    main { max-width: 1180px; margin: 0 auto; padding: 40px 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    .meta { color: #647085; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; overflow: hidden; margin-top: 24px; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e8edf5; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef2f8; font-weight: 700; }
    a { color: #2450a6; word-break: break-all; }
    .badge { display: inline-flex; border-radius: 999px; padding: 3px 8px; font-weight: 700; font-size: 12px; }
    .ok { background: #dcfce7; color: #166534; }
    .fail { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <main>
    <h1>Autolab Staging Smoke Test</h1>
    <p class="meta">Generated at ${escapeHtml(data.generatedAt)} · ${data.passed} passed · ${data.failed} failed · base URL ${escapeHtml(data.baseUrl)}</p>
    <table>
      <thead><tr><th>Status</th><th>Check</th><th>HTTP</th><th>Content Type</th><th>Bytes</th><th>Time</th><th>URL</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
</body>
</html>`;
}

writeFile(options.json, `${JSON.stringify(report, null, 2)}\n`);
writeFile(options.html, renderHtml(report));

if (report.failed > 0) {
  process.exit(1);
}
