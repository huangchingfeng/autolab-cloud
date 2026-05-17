import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePublicDir = path.join(repoRoot, "client", "public");
const tempPublicDir = path.join(repoRoot, ".tmp", "vite-public");
const outputPublicDir = path.join(repoRoot, "dist", "public");

removeDirectory(tempPublicDir);
removeDirectory(outputPublicDir);

if (existsSync(sourcePublicDir)) {
  cpSync(sourcePublicDir, tempPublicDir, {
    recursive: true,
    filter(source) {
      const relative = path.relative(sourcePublicDir, source);
      return relative === "" || !relative.split(path.sep).includes("course-videos");
    },
  });
}

const result = spawnSync("vite", ["build"], {
  cwd: repoRoot,
  env: {
    ...process.env,
    AUTOLAB_VITE_PUBLIC_DIR: tempPublicDir,
  },
  stdio: "inherit",
});

removeDirectory(tempPublicDir);

if ((result.status ?? 1) === 0) {
  copyLargePublicDirectory("course-videos");
}

process.exit(result.status ?? 1);

function copyLargePublicDirectory(relativePath) {
  const source = path.join(sourcePublicDir, relativePath);
  const target = path.join(repoRoot, "dist", "public", relativePath);
  if (!existsSync(source)) return;

  removeDirectory(target);
  mkdirSync(path.dirname(target), { recursive: true });

  const copyResult = spawnSync("cp", ["-R", source, target], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (copyResult.status !== 0) {
    process.exit(copyResult.status ?? 1);
  }
}

function removeDirectory(target) {
  rmSync(target, {
    force: true,
    maxRetries: 5,
    recursive: true,
    retryDelay: 100,
  });
}
