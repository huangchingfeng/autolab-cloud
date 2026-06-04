/**
 * Express App Configuration
 * Separated from server startup for Vercel serverless compatibility
 */

// Only load dotenv in development - Vercel provides env vars automatically
if (process.env.NODE_ENV !== "production") {
  require("dotenv/config");
}

import { clerkMiddleware } from "@clerk/express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import path from "path";
import * as db from "../db";
import { appRouter } from "../routers";
import sitemapRouter from "../routes/sitemap";
import { createContext } from "./context";
import { registerPaymentRoutes } from "./payment";

function hasValidRegistrationSyncSecret(req: express.Request) {
  const expected = process.env.REGISTRATION_SYNC_SECRET;
  if (!expected) {
    return false;
  }

  const authorization = req.header("authorization") ?? "";
  const bearerToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const provided = req.header("x-registration-sync-secret") ?? bearerToken;

  return provided === expected;
}

function toIntegerParam(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export function createApp() {
  const app = express();

  // ⭐ CRITICAL: Payment webhook routes MUST use raw body parser BEFORE global body parsers
  app.use("/api/payment/notify", express.text({ type: "*/*" }));
  app.use("/api/payment/return", express.text({ type: "*/*" }));

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Clerk middleware for authentication
  app.use(clerkMiddleware());

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

  // Read-only endpoint for Google Apps Script / Google Sheets registration sync.
  app.get("/api/integrations/event-registrations", async (req, res) => {
    if (!process.env.REGISTRATION_SYNC_SECRET) {
      return res.status(503).json({
        error: "REGISTRATION_SYNC_SECRET is not configured",
      });
    }

    if (!hasValidRegistrationSyncSecret(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const eventId = toIntegerParam(req.query.eventId);
    const includeCancelled = req.query.includeCancelled === "true";

    try {
      const result = await db.getAllEventRegistrationsWithDetails({ eventId });
      const registrations = result.registrations
        .filter((item) => includeCancelled || item.registration.status !== "cancelled")
        .map((item) => ({
          registrationId: item.registration.id,
          eventId: item.registration.eventId,
          eventTitle: item.event?.title ?? "",
          eventSlug: item.event?.slug ?? "",
          eventDate: item.event?.eventDate?.toISOString?.() ?? item.event?.eventDate ?? null,
          eventEndDate: item.event?.eventEndDate?.toISOString?.() ?? item.event?.eventEndDate ?? null,
          eventTime: item.event?.eventTime ?? "",
          location: item.event?.location ?? "",
          locationDetails: item.event?.locationDetails ?? "",
          meetingUrl: item.event?.meetingUrl ?? "",
          registrationInfo: item.event?.registrationInfo ?? "",
          eventStatus: item.event?.status ?? "",
          name: item.registration.name,
          email: item.registration.email,
          phone: item.registration.phone,
          company: item.registration.company ?? "",
          jobTitle: item.registration.jobTitle ?? "",
          referralSource: item.registration.referralSource ?? "",
          bniChapter: item.registration.bniChapter ?? "",
          registrationStatus: item.registration.status,
          emailSent: item.registration.emailSent,
          subscribeNewsletter: item.registration.subscribeNewsletter,
          registeredAt:
            item.registration.createdAt?.toISOString?.() ?? item.registration.createdAt ?? null,
          updatedAt:
            item.registration.updatedAt?.toISOString?.() ?? item.registration.updatedAt ?? null,
        }));

      return res.json({
        syncedAt: new Date().toISOString(),
        count: registrations.length,
        registrations,
      });
    } catch (error) {
      console.error("[Registration Sync] Failed to export registrations:", error);
      return res.status(500).json({ error: "Failed to export registrations" });
    }
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
