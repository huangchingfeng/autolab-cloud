import path from "path";
import { defineConfig } from "vitest/config";

const root = path.resolve(import.meta.dirname);
const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === "true";

const integrationTestFiles = [
  "server/article-access.test.ts",
  "server/blog.test.ts",
  "server/contact.notification.test.ts",
  "server/contact.test.ts",
  "server/newebpay.test.ts",
  "server/newebpay.validation.test.ts",
  "server/notifications.test.ts",
  "server/translation.test.ts",
  "server/turnstile.test.ts",
];

export default defineConfig({
  root,
  resolve: {
    alias: {
      "@": path.resolve(root, "client", "src"),
      "@shared": path.resolve(root, "shared"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
    exclude: runIntegrationTests
      ? undefined
      : [
          "**/node_modules/**",
          "**/dist/**",
          "**/.{idea,git,cache,output,temp}/**",
          ...integrationTestFiles,
        ],
  },
});
