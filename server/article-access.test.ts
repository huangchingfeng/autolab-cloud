import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/context';
import mysql from 'mysql2/promise';

describe('Article Access Control', () => {
  let conn: mysql.Connection;
  const testEmail = 'test@example.com';
  const testArticleSlug = 'ai-social-media-content-automation';

  beforeAll(async () => {
    conn = await mysql.createConnection(process.env.DATABASE_URL!);
    
    // Insert test email into whitelist
    await conn.execute(
      'INSERT INTO articleAccessWhitelist (email, articleSlug, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())',
      [testEmail, testArticleSlug]
    );
  });

  afterAll(async () => {
    // Clean up test data
    await conn.execute(
      'DELETE FROM articleAccessWhitelist WHERE email = ?',
      [testEmail]
    );
    await conn.end();
  });

  it('should allow access for whitelisted email', async () => {
    const mockContext: Partial<Context> = {
      user: null,
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(mockContext as Context);
    const result = await caller.blog.checkArticleAccess({
      email: testEmail,
      articleSlug: testArticleSlug,
    });

    expect(result.hasAccess).toBe(true);
  });

  it('should deny access for non-whitelisted email', async () => {
    const mockContext: Partial<Context> = {
      user: null,
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(mockContext as Context);
    const result = await caller.blog.checkArticleAccess({
      email: 'notwhitelisted@example.com',
      articleSlug: testArticleSlug,
    });

    expect(result.hasAccess).toBe(false);
  });

  it('should be case-insensitive for email check', async () => {
    const mockContext: Partial<Context> = {
      user: null,
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(mockContext as Context);
    const result = await caller.blog.checkArticleAccess({
      email: 'TEST@EXAMPLE.COM',
      articleSlug: testArticleSlug,
    });

    expect(result.hasAccess).toBe(true);
  });

  it('should throw error when verifying non-whitelisted email', async () => {
    const mockCookies: Record<string, any> = {};
    const mockContext: Partial<Context> = {
      user: null,
      req: {} as any,
      res: {
        cookie: (name: string, value: string, options: any) => {
          mockCookies[name] = value;
        },
      } as any,
    };

    const caller = appRouter.createCaller(mockContext as Context);

    await expect(
      caller.blog.verifyArticleAccess({
        email: 'notwhitelisted@example.com',
        articleSlug: testArticleSlug,
      })
    ).rejects.toThrow('Email not found in whitelist');
  });

  it('should set cookie when verifying whitelisted email', async () => {
    const mockCookies: Record<string, any> = {};
    const mockContext: Partial<Context> = {
      user: null,
      req: {
        headers: { 'x-forwarded-proto': 'https' },
        protocol: 'https',
      } as any,
      res: {
        cookie: (name: string, value: string, options: any) => {
          mockCookies[name] = value;
        },
      } as any,
    };

    const caller = appRouter.createCaller(mockContext as Context);
    const result = await caller.blog.verifyArticleAccess({
      email: testEmail,
      articleSlug: testArticleSlug,
    });

    expect(result.success).toBe(true);
    expect(result.hasAccess).toBe(true);
    expect(mockCookies[`article_access_${testArticleSlug}`]).toBe(testEmail);
  });
});
