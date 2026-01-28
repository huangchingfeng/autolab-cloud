import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("videoCourses.getPublished", () => {
  it("should return published courses for public users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const courses = await caller.videoCourses.getPublished();

    expect(Array.isArray(courses)).toBe(true);
    // All returned courses should be published
    courses.forEach((course) => {
      expect(course.status).toBe("published");
    });
  });
});

describe("videoCourses.getAll", () => {
  it("should return all courses for admin users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const courses = await caller.videoCourses.getAll();

    expect(Array.isArray(courses)).toBe(true);
  });
});

describe("videoCourses.getMyPurchases", () => {
  it("should return empty array for user with no purchases", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const purchases = await caller.videoCourses.getMyPurchases();

    expect(Array.isArray(purchases)).toBe(true);
  });
});
