/**
 * Express App Configuration
 * Separated from server startup for Vercel serverless compatibility
 */

import "dotenv/config";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express, { type RequestHandler } from "express";
import path from "path";
import { appRouter } from "../routers";
import sitemapRouter from "../routes/sitemap";
import { createContext } from "./context";
import { ENV } from "./env";
import { registerPaymentRoutes } from "./payment";

function createLazyClerkMiddleware(): RequestHandler {
  let middlewarePromise: Promise<RequestHandler> | null = null;

  return async (req, res, next) => {
    try {
      middlewarePromise ??= import("@clerk/express").then(({ clerkMiddleware }) => clerkMiddleware());
      const middleware = await middlewarePromise;
      return middleware(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export function createApp() {
  const app = express();

  // ⭐ CRITICAL: Payment webhook routes MUST use raw body parser BEFORE global body parsers
  app.use("/api/payment/notify", express.text({ type: "*/*" }));
  app.use("/api/payment/return", express.text({ type: "*/*" }));

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Clerk middleware for authentication. Public endpoints can still run locally
  // when Clerk env vars are not configured.
  if (ENV.clerkSecretKey && ENV.clerkPublishableKey) {
    app.use(createLazyClerkMiddleware());
  } else {
    console.warn("[Auth] Clerk env vars not configured; auth middleware disabled.");
  }

  // Payment callback routes
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

  // Serve static files in production
  if (process.env.NODE_ENV === "production") {
    const publicPath = path.resolve(process.cwd(), "dist/public");
    app.use(express.static(publicPath));

    // SPA fallback - serve index.html for all non-API routes
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(publicPath, "index.html"));
    });
  }

  return app;
}

export const app = createApp();
export default app;
