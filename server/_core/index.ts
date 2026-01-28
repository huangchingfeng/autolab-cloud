import "dotenv/config";
import { clerkMiddleware } from "@clerk/express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import { createServer } from "http";
import net from "net";
import { appRouter } from "../routers";
import sitemapRouter from "../routes/sitemap";
import { createContext } from "./context";
import { ENV, validateEnv } from "./env";
import { registerPaymentRoutes } from "./payment";
import { serveStatic, setupVite } from "./vite";

// 驗證環境變數
validateEnv();

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ⭐ CRITICAL: Payment webhook routes MUST use raw body parser BEFORE global body parsers
  // This prevents express.urlencoded() from failing on NewebPay's request format
  app.use("/api/payment/notify", express.text({ type: "*/*" }));
  app.use("/api/payment/return", express.text({ type: "*/*" }));

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Clerk middleware for authentication
  // 這會自動處理 JWT 驗證，並將使用者資訊附加到 req.auth
  app.use(clerkMiddleware());

  // Payment callback routes (handlers already have raw body from above)
  registerPaymentRoutes(app);

  // Sitemap and robots.txt routes
  app.use(sitemapRouter);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}/`);
    console.log(`   Environment: ${ENV.isProduction ? "production" : "development"}`);
  });
}

startServer().catch(console.error);
