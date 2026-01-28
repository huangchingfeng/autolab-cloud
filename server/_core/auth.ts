/**
 * Clerk 認證整合
 * 替代原本的 Manus OAuth 系統
 */

import { clerkClient } from "@clerk/express";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

// Clerk User 資訊型別
export interface ClerkUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  primaryEmailAddressId: string | null;
  imageUrl: string;
}

/**
 * 從 Clerk 的 Authorization header 取得使用者
 */
export async function getClerkUser(req: Request): Promise<ClerkUser | null> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    // 驗證 JWT token 並取得使用者 ID
    const { sub: userId } = await clerkClient.verifyToken(token);

    if (!userId) {
      return null;
    }

    // 取得完整使用者資訊
    const user = await clerkClient.users.getUser(userId);
    return user as ClerkUser;
  } catch (error) {
    console.error("[Auth] Failed to verify Clerk token:", error);
    return null;
  }
}

/**
 * 從 Request 取得或建立資料庫使用者
 */
export async function authenticateRequest(req: Request): Promise<User | null> {
  // 嘗試從 Clerk session 取得使用者
  const clerkUser = await getClerkUser(req);

  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses.find(
    (e) => e.emailAddress
  )?.emailAddress ?? null;

  const name = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ") || null;

  // 同步使用者到資料庫
  await db.upsertUser({
    openId: clerkUser.id, // 使用 Clerk User ID 作為 openId
    name,
    email,
    loginMethod: "clerk",
    lastSignedIn: new Date(),
  });

  const user = await db.getUserByOpenId(clerkUser.id);
  return user;
}

/**
 * 檢查使用者是否為管理員
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return ENV.adminUserIds.includes(user.openId);
}

/**
 * Express middleware: 要求已登入
 */
export function requireAuth(req: Request, res: any, next: any) {
  if (!req.auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

/**
 * Express middleware: 要求管理員權限
 */
export async function requireAdmin(req: Request, res: any, next: any) {
  if (!req.auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!ENV.adminUserIds.includes(req.auth.userId)) {
    return res.status(403).json({ error: "Forbidden - Admin only" });
  }

  next();
}
