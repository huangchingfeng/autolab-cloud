import { createServer, type Server } from "node:http";
import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import sitemapRouter from "./routes/sitemap";

const originalEnv = {
  VITE_APP_URL: process.env.VITE_APP_URL,
  SITEMAP_SKIP_DYNAMIC: process.env.SITEMAP_SKIP_DYNAMIC,
};

afterEach(() => {
  restoreEnv("VITE_APP_URL", originalEnv.VITE_APP_URL);
  restoreEnv("SITEMAP_SKIP_DYNAMIC", originalEnv.SITEMAP_SKIP_DYNAMIC);
});

describe("sitemap routes", () => {
  it("uses the request host for local smoke when no app URL is configured", async () => {
    delete process.env.VITE_APP_URL;
    process.env.SITEMAP_SKIP_DYNAMIC = "true";

    await withSitemapServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/sitemap.xml`);
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/xml");
      expect(body).toContain(`<loc>${baseUrl}</loc>`);
      expect(body).toContain(`<loc>${baseUrl}/ai-super-sales</loc>`);
      expect(body).toContain(`<loc>${baseUrl}/insurance-ai-tools</loc>`);
      expect(body).not.toContain("https://autolab.cloud");
    });
  });

  it("uses VITE_APP_URL for robots.txt when staging URL is configured", async () => {
    process.env.VITE_APP_URL = "https://autolab-staging.example.com/";
    process.env.SITEMAP_SKIP_DYNAMIC = "true";

    await withSitemapServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/robots.txt`);
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/plain");
      expect(body).toContain("Disallow: /admin/");
      expect(body).toContain("Sitemap: https://autolab-staging.example.com/sitemap.xml");
      expect(body).not.toContain("https://autolab.cloud/sitemap.xml");
    });
  });
});

async function withSitemapServer(run: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(sitemapRouter);

  const server = createServer(app);
  await listen(server);

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to read test server address.");
  }

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await close(server);
  }
}

function listen(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
}

function close(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function restoreEnv(key: keyof typeof originalEnv, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
