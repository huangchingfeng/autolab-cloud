import type { Request, RequestHandler } from "express";

export interface ClerkAuthObject {
  userId: string | null;
  sessionId?: string | null;
  orgId?: string | null;
}

export function clerkMiddleware(...args: unknown[]): RequestHandler;

export function getAuth(req: Request): ClerkAuthObject;

export const clerkClient: {
  users: {
    getUser(userId: string): Promise<unknown>;
  };
};
