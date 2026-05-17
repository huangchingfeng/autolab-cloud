#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const BASE = "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM";

const assets = [
  {
    kind: "download",
    source: `${BASE}/downloads/%E5%8F%B0%E7%81%A3_2026_AI_%E5%9F%B7%E8%A1%8C%E7%B3%BB%E7%B5%B1-cyjk61fb92.pdf`,
    target: "downloads/taiwan-2026-ai-execution-system.pdf",
  },
  {
    kind: "download",
    source: `${BASE}/downloads/gemini-ai-strategy-guide-1766013637092.pdf`,
    target: "downloads/gemini-ai-strategy-guide.pdf",
  },
  {
    kind: "download",
    source: `${BASE}/downloads/notebooklm-8-tips-slides-1766211981791.pdf`,
    target: "downloads/notebooklm-8-tips-slides.pdf",
  },
  {
    kind: "download",
    source: `${BASE}/blog/ai-crm/AI_CRM_%E6%95%88%E7%8E%87%E9%9D%A9%E5%91%BD.pdf`,
    target: "downloads/ai-crm-efficiency-revolution.pdf",
  },
  {
    kind: "download",
    source: `${BASE}/manus-article/AI%E4%BB%A3%E7%90%86%E4%BA%BAManus%E8%AA%B2%E5%BE%8C%E7%B2%BE%E8%8F%AF.pdf`,
    target: "downloads/manus-ai-agent-summary.pdf",
  },
  {
    kind: "download",
    source: `${BASE}/manus-article/ManusAI%E7%B3%BB%E7%B5%B1%E6%87%89%E7%94%A8%E8%88%87%E5%8A%9F%E8%83%BD%E7%89%B9%E9%BB%9E%E7%B8%BD%E8%A6%BD.xlsx`,
    target: "downloads/manus-ai-system-overview.xlsx",
  },
  {
    kind: "image",
    source: `${BASE}/notebooklm-course/notebooklm-2026-ai-upgrade-y0c251ob.png`,
    target: "images/notebooklm-course/notebooklm-2026-ai-upgrade.png",
  },
  {
    kind: "image",
    source: `${BASE}/notebooklm-course/notebooklm-iceberg-potential-5noxgebz.png`,
    target: "images/notebooklm-course/notebooklm-iceberg-potential.png",
  },
  {
    kind: "image",
    source: `${BASE}/notebooklm-course/notebooklm-old-pain-points-2u8po5i7.png`,
    target: "images/notebooklm-course/notebooklm-old-pain-points.png",
  },
  {
    kind: "image",
    source: `${BASE}/notebooklm-course/notebooklm-thinking-partner-92i2ns75.png`,
    target: "images/notebooklm-course/notebooklm-thinking-partner.png",
  },
  {
    kind: "image",
    source: `${BASE}/notebooklm-course/notebooklm-solution-1-multimodal-u732lq1r.png`,
    target: "images/notebooklm-course/notebooklm-solution-1-multimodal.png",
  },
  {
    kind: "image",
    source: `${BASE}/notebooklm-course/notebooklm-solution-2-podcast-hjtk8n8n.png`,
    target: "images/notebooklm-course/notebooklm-solution-2-podcast.png",
  },
  {
    kind: "image",
    source: `${BASE}/notebooklm-course/notebooklm-solution-3-creation-kuir2a6t.png`,
    target: "images/notebooklm-course/notebooklm-solution-3-creation.png",
  },
  {
    kind: "image",
    source: `${BASE}/notebooklm-course/notebooklm-2026-superpower-kqjnv7l5.png`,
    target: "images/notebooklm-course/notebooklm-2026-superpower.png",
  },
  {
    kind: "image",
    source: `${BASE}/notebooklm-course/notebooklm-testimonial-gift-ji9lecqu.png`,
    target: "images/notebooklm-course/notebooklm-testimonial-gift.png",
  },
  ...Array.from({ length: 13 }, (_, index) => {
    const ids = [
      "32mrn46q",
      "hi6r1szh",
      "09qmh6y7",
      "fcbuqgsq",
      "fgdrnhdo",
      "4amdy5hr",
      "nhaw66l2",
      "4xveac5i",
      "2w9wql90",
      "fybimiar",
      "s4kw7uyg",
      "1yyoo98z",
      "9aiy0fno",
    ];
    const number = String(index + 1).padStart(2, "0");
    return {
      kind: "image",
      source: `${BASE}/notebooklm-course/student-works/student-work-${number}-${ids[index]}.png`,
      target: `images/notebooklm-course/student-works/student-work-${number}.png`,
    };
  }),
  {
    kind: "video",
    source: `${BASE}/course-videos/video-1766018137402-q34lji.mov`,
    target: "course-videos/ai-tools-practice.mov",
  },
  {
    kind: "video",
    source: `${BASE}/course-videos/video-1766018142710-3t4i2.mov`,
    target: "course-videos/corporate-training-highlights.mov",
  },
  {
    kind: "video",
    source: `${BASE}/course-videos/video-1766018149511-3zljzr.mov`,
    target: "course-videos/prompt-engineering-practice.mov",
  },
  {
    kind: "video",
    source: `${BASE}/course-videos/video-1766018156978-gd7vim.mov`,
    target: "course-videos/ai-automation-workflow.mov",
  },
  {
    kind: "video",
    source: `${BASE}/course-videos/video-1766018160939-s6uf1o.mov`,
    target: "course-videos/student-showcase.mov",
  },
  {
    kind: "video",
    source: `${BASE}/course-videos/video-1766018167185-0szbk.mov`,
    target: "course-videos/qa-session.mov",
  },
];

const options = {
  publicRoot: "client/public",
  skipExisting: true,
  kinds: new Set(),
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--public-root=")) options.publicRoot = arg.slice("--public-root=".length);
  if (arg === "--force") options.skipExisting = false;
  if (arg.startsWith("--kind=")) {
    for (const kind of arg.slice("--kind=".length).split(",")) {
      if (kind.trim()) options.kinds.add(kind.trim());
    }
  }
}

const selectedAssets = assets.filter(asset => options.kinds.size === 0 || options.kinds.has(asset.kind));
const publicRoot = path.resolve(process.cwd(), options.publicRoot);

async function downloadAsset(asset) {
  const target = path.join(publicRoot, asset.target);
  if (options.skipExisting && fs.existsSync(target) && fs.statSync(target).size > 0) {
    return { asset, status: "skipped", bytes: fs.statSync(target).size };
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tempTarget = `${target}.tmp`;
  const response = await fetch(asset.source);
  if (!response.ok || !response.body) {
    throw new Error(`Download failed ${response.status} ${response.statusText}: ${asset.source}`);
  }

  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(tempTarget));
  fs.renameSync(tempTarget, target);
  return { asset, status: "downloaded", bytes: fs.statSync(target).size };
}

let totalBytes = 0;
for (const asset of selectedAssets) {
  const result = await downloadAsset(asset);
  totalBytes += result.bytes;
  console.log(`${result.status.padEnd(10)} ${result.bytes.toString().padStart(10)} ${asset.target}`);
}

console.log(`Processed ${selectedAssets.length} assets. Total local bytes: ${totalBytes}.`);
