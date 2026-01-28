import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    email: "admin@example.com",
    name: "Test Admin",
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

function createPublicContext(): TrpcContext {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Blog API", () => {
  describe("Public Procedures", () => {
    it("should get published posts", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.blog.getPosts({ limit: 10 });
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("should get categories", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.blog.getCategories();
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("should get tags", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.blog.getTags();
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("should search posts with empty results", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.blog.searchPosts({ searchTerm: "nonexistent-search-term-12345" });
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Admin Procedures", () => {
    it("should allow admin to get all posts", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.blog.getAllPosts();
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("should allow admin to create category", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const testSlug = `test-category-${Date.now()}`;

      const result = await caller.blog.createCategory({
        name: "Test Category",
        slug: testSlug,
        description: "Test description",
      });
      
      expect(result.success).toBe(true);

      // Cleanup
      const categories = await db.getAllCategories();
      const testCategory = categories.find(c => c.slug === testSlug);
      if (testCategory) {
        await db.deleteCategory(testCategory.id);
      }
    });

    it("should allow admin to create tag", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const testSlug = `test-tag-${Date.now()}`;

      const result = await caller.blog.createTag({
        name: "Test Tag",
        slug: testSlug,
      });
      
      expect(result.success).toBe(true);

      // Cleanup
      const tags = await db.getAllTags();
      const testTag = tags.find(t => t.slug === testSlug);
      if (testTag) {
        await db.deleteTag(testTag.id);
      }
    });

    it("should allow admin to create post", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const testSlug = `test-post-${Date.now()}`;

      // Create post
      const createResult = await caller.blog.createPost({
        title: "Test Post",
        slug: testSlug,
        content: "Test content",
        excerpt: "Test excerpt",
        status: "draft",
      });
      
      expect(createResult.success).toBe(true);
      expect(createResult).toHaveProperty("postId");
    });

    it("should prevent non-admin from accessing admin procedures", async () => {
      const user: AuthenticatedUser = {
        id: 2,
        openId: "test-user",
        email: "user@example.com",
        name: "Test User",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx: TrpcContext = {
        user,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {
          clearCookie: () => {},
        } as TrpcContext["res"],
      };

      const caller = appRouter.createCaller(ctx);

      await expect(caller.blog.getAllPosts()).rejects.toThrow();
    });
  });
});
