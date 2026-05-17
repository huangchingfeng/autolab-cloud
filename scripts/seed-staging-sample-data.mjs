#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import postgres from "postgres";

const options = {
  apply: false,
  envFile: fs.existsSync(".env.staging") ? ".env.staging" : "",
  json: "",
  html: "",
};

for (const arg of process.argv.slice(2)) {
  if (arg === "--apply") options.apply = true;
  if (arg.startsWith("--env-file=")) options.envFile = arg.slice("--env-file=".length);
  if (arg.startsWith("--json=")) options.json = arg.slice("--json=".length);
  if (arg.startsWith("--html=")) options.html = arg.slice("--html=".length);
}

if (options.envFile) loadEnvFile(options.envFile);

const seed = {
  users: 1,
  categories: 1,
  tags: 2,
  posts: 1,
  contacts: 2,
  aiSuperSalesRegistrations: 2,
  corporateInquiries: 2,
};

const report = {
  generatedAt: new Date().toISOString(),
  mode: options.apply ? "apply" : "dry-run",
  envFile: options.envFile ? path.resolve(options.envFile) : "",
  tables: Object.entries(seed).map(([table, rows]) => ({ table, rows })),
  written: [],
  warnings: [],
};

console.log("Autolab staging sample seed");
console.log("===========================");
console.log(`Mode: ${report.mode}`);
if (options.envFile) console.log(`Env file: ${path.resolve(options.envFile)}`);
console.log("");
for (const item of report.tables) console.log(`${item.table}\t${item.rows}`);

if (!options.apply) {
  report.warnings.push("Dry-run only. Add --apply with ALLOW_STAGING_DB_WRITE=true and STAGING_SEED_CONFIRM=autolab-staging to write.");
  writeReports(report);
  console.log("");
  console.log(report.warnings[0]);
  process.exit(0);
}

validateWriteGuards();

const db = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  await db.begin(async tx => {
    const user = await upsertSeedUser(tx);
    report.written.push({ table: "users", rows: 1 });

    const category = await upsertCategory(tx);
    report.written.push({ table: "categories", rows: 1 });

    const tags = await upsertTags(tx);
    report.written.push({ table: "tags", rows: tags.length });

    const post = await upsertPost(tx, user.id, category.id);
    await replacePostTags(tx, post.id, tags.map(tag => tag.id));
    report.written.push({ table: "posts", rows: 1 });
    report.written.push({ table: "postTags", rows: tags.length });

    const contactRows = await replaceContacts(tx);
    report.written.push({ table: "contacts", rows: contactRows });

    const aiRows = await replaceAISuperSalesRegistrations(tx);
    report.written.push({ table: "aiSuperSalesRegistrations", rows: aiRows });

    const corporateRows = await replaceCorporateInquiries(tx);
    report.written.push({ table: "corporateInquiries", rows: corporateRows });
  });
} finally {
  await db.end();
}

writeReports(report);
console.log("");
console.log("Seed complete.");
if (options.html) console.log(`Wrote ${path.resolve(options.html)}`);
if (options.json) console.log(`Wrote ${path.resolve(options.json)}`);

function loadEnvFile(file) {
  const absolute = path.resolve(file);
  if (!fs.existsSync(absolute)) {
    console.error(`Env file not found: ${absolute}`);
    process.exit(1);
  }

  for (const line of fs.readFileSync(absolute, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

function validateWriteGuards() {
  if (process.env.ALLOW_STAGING_DB_WRITE !== "true" || process.env.STAGING_SEED_CONFIRM !== "autolab-staging") {
    console.error("Refusing to write. Set ALLOW_STAGING_DB_WRITE=true and STAGING_SEED_CONFIRM=autolab-staging.");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL || "";
  if (!databaseUrl) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    console.error("DATABASE_URL must be PostgreSQL.");
    process.exit(1);
  }

  if (/tidbcloud|mysql|manus|production|prod/i.test(databaseUrl)) {
    console.error("Refusing to write to a production, Manus, TiDB, MySQL, or prod-looking DATABASE_URL.");
    process.exit(1);
  }
}

async function upsertSeedUser(tx) {
  const [user] = await tx`
    INSERT INTO "users" ("openId", "name", "email", "loginMethod", "role", "lastSignedIn", "createdAt", "updatedAt")
    VALUES ('staging-seed-admin', 'Autolab Staging Admin', 'staging+admin@example.test', 'seed', 'admin', now(), now(), now())
    ON CONFLICT ("openId") DO UPDATE SET
      "name" = EXCLUDED."name",
      "email" = EXCLUDED."email",
      "role" = EXCLUDED."role",
      "updatedAt" = now()
    RETURNING "id"
  `;
  return user;
}

async function upsertCategory(tx) {
  const [category] = await tx`
    INSERT INTO "categories" ("name", "slug", "description", "createdAt", "updatedAt")
    VALUES ('Staging 測試內容', 'staging-seed', 'Preview/staging 驗收用測試分類', now(), now())
    ON CONFLICT ("slug") DO UPDATE SET
      "name" = EXCLUDED."name",
      "description" = EXCLUDED."description",
      "updatedAt" = now()
    RETURNING "id"
  `;
  return category;
}

async function upsertTags(tx) {
  const rows = [];
  for (const tag of [
    { name: "staging", slug: "staging" },
    { name: "migration-test", slug: "migration-test" },
  ]) {
    const [row] = await tx`
      INSERT INTO "tags" ("name", "slug", "createdAt")
      VALUES (${tag.name}, ${tag.slug}, now())
      ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name"
      RETURNING "id"
    `;
    rows.push(row);
  }
  return rows;
}

async function upsertPost(tx, authorId, categoryId) {
  const [post] = await tx`
    INSERT INTO "posts" (
      "title", "slug", "excerpt", "content", "coverImage", "categoryId", "authorId",
      "status", "publishedAt", "createdAt", "updatedAt", "viewCount"
    )
    VALUES (
      'Staging 測試文章：Autolab 搬站驗收',
      'staging-seed-autolab-migration-check',
      '這是一篇只用於 staging 驗收的測試文章。',
      '<p>這篇文章用來確認 preview 網站的文章列表、文章詳情、分類與標籤可以正常讀取。</p>',
      '/images/manus-event/content-alchemy.png',
      ${categoryId},
      ${authorId},
      'published',
      now(),
      now(),
      now(),
      0
    )
    ON CONFLICT ("slug") DO UPDATE SET
      "title" = EXCLUDED."title",
      "excerpt" = EXCLUDED."excerpt",
      "content" = EXCLUDED."content",
      "coverImage" = EXCLUDED."coverImage",
      "categoryId" = EXCLUDED."categoryId",
      "authorId" = EXCLUDED."authorId",
      "status" = EXCLUDED."status",
      "publishedAt" = EXCLUDED."publishedAt",
      "updatedAt" = now()
    RETURNING "id"
  `;
  return post;
}

async function replacePostTags(tx, postId, tagIds) {
  await tx`DELETE FROM "postTags" WHERE "postId" = ${postId}`;
  for (const tagId of tagIds) {
    await tx`
      INSERT INTO "postTags" ("postId", "tagId", "createdAt")
      VALUES (${postId}, ${tagId}, now())
    `;
  }
}

async function replaceContacts(tx) {
  const rows = [
    {
      name: "Staging 企業邀課測試",
      email: "staging+contact-enterprise@example.test",
      phone: "0900000001",
      company: "Autolab Staging Co.",
      jobTitle: "HR Manager",
      inquiryType: "enterprise_training",
      message: "這是 staging seed 產生的企業邀課測試資料。",
      status: "pending",
    },
    {
      name: "Staging 一對一諮詢測試",
      email: "staging+contact-coaching@example.test",
      phone: "0900000002",
      company: "Autolab Preview Team",
      jobTitle: "Founder",
      inquiryType: "one_on_one",
      message: "這是 staging seed 產生的一對一諮詢測試資料。",
      status: "contacted",
    },
  ];

  await tx`DELETE FROM "contacts" WHERE "email" LIKE 'staging+contact-%@example.test'`;
  for (const row of rows) {
    await tx`
      INSERT INTO "contacts" (
        "name", "email", "phone", "company", "jobTitle", "inquiryType",
        "message", "status", "notes", "createdAt", "updatedAt"
      )
      VALUES (
        ${row.name}, ${row.email}, ${row.phone}, ${row.company}, ${row.jobTitle},
        ${row.inquiryType}, ${row.message}, ${row.status}, 'autolab-staging-seed', now(), now()
      )
    `;
  }
  return rows.length;
}

async function replaceAISuperSalesRegistrations(tx) {
  const rows = [
    {
      name: "Staging AI 業務測試 A",
      email: "staging+ai-sales-a@example.test",
      phone: "0900000011",
      company: "Autolab Seed",
      jobTitle: "Sales Lead",
      selectedSessions: ["session1", "session2"],
      referralSource: "line_community",
      subscribeNewsletter: true,
      notes: "staging seed: partial sessions",
    },
    {
      name: "Staging AI 業務測試 B",
      email: "staging+ai-sales-b@example.test",
      phone: "0900000012",
      company: "Preview Customer",
      jobTitle: "Owner",
      selectedSessions: ["all"],
      referralSource: "teacher",
      subscribeNewsletter: false,
      notes: "staging seed: all sessions",
    },
  ];

  await tx`DELETE FROM "aiSuperSalesRegistrations" WHERE "email" LIKE 'staging+ai-sales-%@example.test'`;
  for (const row of rows) {
    await tx`
      INSERT INTO "aiSuperSalesRegistrations" (
        "name", "email", "phone", "company", "jobTitle", "selectedSessions",
        "referralSource", "subscribeNewsletter", "emailSent", "notes", "createdAt", "updatedAt"
      )
      VALUES (
        ${row.name}, ${row.email}, ${row.phone}, ${row.company}, ${row.jobTitle},
        ${JSON.stringify(row.selectedSessions)}::jsonb, ${row.referralSource}, ${row.subscribeNewsletter},
        false, ${row.notes}, now(), now()
      )
    `;
  }
  return rows.length;
}

async function replaceCorporateInquiries(tx) {
  const rows = [
    {
      name: "Staging 企業窗口 A",
      company: "Autolab Staging Manufacturing",
      jobTitle: "Learning Manager",
      email: "staging+corp-a@example.test",
      phone: "0900000021",
      headcount: "31-100",
      programs: "AI 辦公效率\nAI 業務開發",
      preferredTime: "2026 Q2",
      notes: "需要 2 小時入門課。",
      sourcePage: "general",
      status: "new",
    },
    {
      name: "Staging 企業窗口 B",
      company: "Autolab Staging Tech",
      jobTitle: "COO",
      email: "staging+corp-b@example.test",
      phone: "0900000022",
      headcount: "101-300",
      programs: "AI 流程自動化\n主管 AI 決策",
      preferredTime: "平日下午",
      notes: "需要客製化內訓提案。",
      sourcePage: "tech",
      status: "quoted",
    },
  ];

  await tx`DELETE FROM "corporateInquiries" WHERE "email" LIKE 'staging+corp-%@example.test'`;
  for (const row of rows) {
    await tx`
      INSERT INTO "corporateInquiries" (
        "name", "company", "jobTitle", "email", "phone", "headcount",
        "programs", "preferredTime", "notes", "sourcePage", "status",
        "adminNotes", "emailSent", "createdAt", "updatedAt"
      )
      VALUES (
        ${row.name}, ${row.company}, ${row.jobTitle}, ${row.email}, ${row.phone},
        ${row.headcount}, ${row.programs}, ${row.preferredTime}, ${row.notes},
        ${row.sourcePage}, ${row.status}, 'autolab-staging-seed', false, now(), now()
      )
    `;
  }
  return rows.length;
}

function writeReports(data) {
  writeFile(options.json, `${JSON.stringify(data, null, 2)}\n`);
  writeFile(options.html, renderHtml(data));
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
  const tableRows = data.tables
    .map(item => `<tr><td><code>${escapeHtml(item.table)}</code></td><td>${item.rows}</td></tr>`)
    .join("\n        ");
  const writtenRows = data.written.length
    ? data.written.map(item => `<tr><td><code>${escapeHtml(item.table)}</code></td><td>${item.rows}</td></tr>`).join("\n        ")
    : `<tr><td colspan="2">No writes in dry-run mode.</td></tr>`;

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autolab Staging Sample Seed</title>
  <style>
    body { margin: 0; background: #f7f8fb; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; line-height: 1.65; }
    main { max-width: 960px; margin: 0 auto; padding: 44px 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    h2 { margin-top: 32px; padding-top: 18px; border-top: 1px solid #dce4f0; font-size: 20px; }
    .lead { color: #647085; }
    .notice { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 16px; margin: 22px 0; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e8edf5; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #eef2f8; font-weight: 700; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  </style>
</head>
<body>
  <main>
    <h1>Autolab Staging Sample Seed</h1>
    <p class="lead">Generated at ${escapeHtml(data.generatedAt)} · mode <code>${escapeHtml(data.mode)}</code></p>
    <div class="notice">這批資料只用於 preview/staging 後台驗收。正式資料搬遷仍需完整 Manus DB dump。</div>

    <h2>Planned Rows</h2>
    <table>
      <thead><tr><th>Table</th><th>Rows</th></tr></thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <h2>Written Rows</h2>
    <table>
      <thead><tr><th>Table</th><th>Rows</th></tr></thead>
      <tbody>
        ${writtenRows}
      </tbody>
    </table>
  </main>
</body>
</html>
`;
}
