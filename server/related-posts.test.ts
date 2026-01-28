import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

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

describe("Related Posts API", () => {
  describe("Public Procedures", () => {
    it("should get related posts for a given post", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      // Get a published post first
      const posts = await db.getPublishedPosts(1);
      
      if (posts.length > 0) {
        const postId = posts[0].post.id;
        const relatedPosts = await caller.blog.getRelatedPosts({ postId, limit: 3 });
        
        expect(Array.isArray(relatedPosts)).toBe(true);
        expect(relatedPosts.length).toBeLessThanOrEqual(3);
        
        // Verify that the related posts don't include the original post
        relatedPosts.forEach((item) => {
          expect(item.post.id).not.toBe(postId);
        });
        
        // Verify structure of related posts
        if (relatedPosts.length > 0) {
          expect(relatedPosts[0]).toHaveProperty("post");
          expect(relatedPosts[0]).toHaveProperty("author");
          expect(relatedPosts[0]).toHaveProperty("category");
          expect(relatedPosts[0].post).toHaveProperty("id");
          expect(relatedPosts[0].post).toHaveProperty("title");
          expect(relatedPosts[0].post).toHaveProperty("slug");
        }
      }
    });

    it("should return empty array for non-existent post", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      // Use a very large ID that doesn't exist
      const relatedPosts = await caller.blog.getRelatedPosts({ postId: 999999999, limit: 3 });
      
      expect(Array.isArray(relatedPosts)).toBe(true);
      expect(relatedPosts.length).toBe(0);
    });

    it("should respect the limit parameter", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      // Get a published post first
      const posts = await db.getPublishedPosts(1);
      
      if (posts.length > 0) {
        const postId = posts[0].post.id;
        
        // Test with limit of 1
        const relatedPosts1 = await caller.blog.getRelatedPosts({ postId, limit: 1 });
        expect(relatedPosts1.length).toBeLessThanOrEqual(1);
        
        // Test with limit of 2
        const relatedPosts2 = await caller.blog.getRelatedPosts({ postId, limit: 2 });
        expect(relatedPosts2.length).toBeLessThanOrEqual(2);
      }
    });
  });
});
