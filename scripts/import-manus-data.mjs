#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import postgres from "postgres";

const options = {
  data: "",
  tables: [],
  apply: false,
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--data=")) options.data = arg.slice("--data=".length);
  if (arg.startsWith("--tables=")) {
    options.tables = arg.slice("--tables=".length).split(",").map(item => item.trim()).filter(Boolean);
  }
  if (arg === "--apply") options.apply = true;
}

if (!options.data) {
  console.error("Usage: npm run manus:import-data -- --data=/path/to/prepared.json [--tables=categories,tags] [--apply]");
  process.exit(1);
}

const dataPath = path.resolve(options.data);
const payload = JSON.parse(fs.readFileSync(dataPath, "utf8"));
if (payload.kind !== "autolab-manus-data-package") {
  console.error(`Not an Autolab Manus data package: ${dataPath}`);
  process.exit(1);
}

const selectedTables = options.tables.length > 0 ? options.tables : Object.keys(payload.tables);
const counts = selectedTables.map(table => ({
  table,
  rows: payload.tables[table]?.importable?.length ?? 0,
  available: Boolean(payload.tables[table]),
}));

console.log("Autolab Manus staging import");
console.log("============================");
console.log(`Data: ${dataPath}`);
console.log(`Mode: ${options.apply ? "apply" : "dry-run"}`);
console.log("");
console.log("table\trows\tavailable");
for (const count of counts) {
  console.log(`${count.table}\t${count.rows}\t${count.available ? "yes" : "no"}`);
}

if (!options.apply) {
  console.log("");
  console.log("Dry-run only. Add --apply with ALLOW_STAGING_DB_WRITE=true and STAGING_IMPORT_CONFIRM=autolab-staging to write.");
  process.exit(0);
}

if (process.env.ALLOW_STAGING_DB_WRITE !== "true" || process.env.STAGING_IMPORT_CONFIRM !== "autolab-staging") {
  console.error("Refusing to write. Set ALLOW_STAGING_DB_WRITE=true and STAGING_IMPORT_CONFIRM=autolab-staging.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

if (/tidbcloud|mysql/i.test(process.env.DATABASE_URL)) {
  console.error("Refusing to write to a TiDB/MySQL-looking DATABASE_URL.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

async function upsertRows(db, table, tableData) {
  const rows = tableData.importable.map(item => item.row);
  if (rows.length === 0) return 0;

  const columns = tableData.columns.filter(column => rows.some(row => row[column] !== undefined));
  if (!columns.includes("id")) {
    columns.unshift("id");
  }

  let written = 0;
  for (const row of rows) {
    const presentColumns = columns.filter(column => row[column] !== undefined);
    if (presentColumns.length === 0) continue;

    const identifiers = presentColumns.map(quoteIdentifier).join(", ");
    const values = presentColumns.map(column => row[column]);
    const assignments = presentColumns
      .filter(column => column !== "id")
      .map(column => `${quoteIdentifier(column)} = EXCLUDED.${quoteIdentifier(column)}`)
      .join(", ");

    if (row.id !== undefined && row.id !== null && assignments) {
      await db.unsafe(
        `INSERT INTO ${quoteIdentifier(table)} (${identifiers}) VALUES (${presentColumns.map((_, index) => `$${index + 1}`).join(", ")}) ON CONFLICT ("id") DO UPDATE SET ${assignments}`,
        values
      );
    } else {
      await db.unsafe(
        `INSERT INTO ${quoteIdentifier(table)} (${identifiers}) VALUES (${presentColumns.map((_, index) => `$${index + 1}`).join(", ")})`,
        values
      );
    }
    written += 1;
  }

  if (tableData.serial && rows.some(row => row[tableData.serial] !== undefined && row[tableData.serial] !== null)) {
    await db.unsafe(
      `SELECT setval(pg_get_serial_sequence($1, $2), COALESCE((SELECT MAX(${quoteIdentifier(tableData.serial)}) FROM ${quoteIdentifier(table)}), 1), true)`,
      [table, tableData.serial]
    );
  }

  return written;
}

try {
  await sql.begin(async tx => {
    for (const table of selectedTables) {
      const tableData = payload.tables[table];
      if (!tableData) {
        console.warn(`Skipping unknown table: ${table}`);
        continue;
      }
      const written = await upsertRows(tx, table, tableData);
      console.log(`Wrote ${written} rows to ${table}`);
    }
  });
} finally {
  await sql.end();
}

console.log("Import complete.");
