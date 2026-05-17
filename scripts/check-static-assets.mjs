#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const options = {
  publicRoot: "client/public",
  roots: ["client/src"],
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--public-root=")) options.publicRoot = arg.slice("--public-root=".length);
  if (arg.startsWith("--root=")) options.roots.push(arg.slice("--root=".length));
}

const repoRoot = process.cwd();
const publicRoot = path.resolve(repoRoot, options.publicRoot);
const assetPattern = /["'`]\/((?:course-videos|downloads|images)\/[^"'`]+?\.(?:avif|gif|jpe?g|mov|mp4|pdf|png|svg|webp|xlsx?))["'`]/gi;

function walk(target) {
  const absolute = path.resolve(repoRoot, target);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [absolute];
  if (!stat.isDirectory()) return [];

  const files = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
    const child = path.join(absolute, entry.name);
    if (entry.isDirectory()) files.push(...walk(path.relative(repoRoot, child)));
    if (entry.isFile()) files.push(child);
  }
  return files;
}

function readTextFile(file) {
  const stat = fs.statSync(file);
  if (stat.size > 2_000_000) return "";
  const buffer = fs.readFileSync(file);
  if (buffer.includes(0)) return "";
  return buffer.toString("utf8");
}

const references = new Map();
for (const file of [...new Set(options.roots.flatMap(walk))].sort()) {
  const text = readTextFile(file);
  if (!text) continue;

  for (const match of text.matchAll(assetPattern)) {
    const relPath = match[1];
    const item = references.get(relPath) ?? {
      path: relPath,
      locations: [],
      exists: false,
      bytes: 0,
    };
    const before = text.slice(0, match.index);
    const line = before.split(/\r?\n/).length;
    item.locations.push(`${path.relative(repoRoot, file)}:${line}`);
    references.set(relPath, item);
  }
}

const results = [...references.values()].sort((a, b) => a.path.localeCompare(b.path));
let totalBytes = 0;
for (const item of results) {
  const fullPath = path.join(publicRoot, item.path);
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    item.exists = stat.isFile();
    item.bytes = item.exists ? stat.size : 0;
    totalBytes += item.bytes;
  }
}

const missing = results.filter(item => !item.exists);

console.log(`Checked ${results.length} static asset references.`);
console.log(`Referenced local asset bytes: ${totalBytes}.`);
if (missing.length > 0) {
  console.error("");
  console.error("Missing static assets:");
  for (const item of missing) {
    console.error(`- /${item.path} referenced at ${item.locations.join(", ")}`);
  }
  process.exit(1);
}

console.log("All referenced local static assets exist.");
