import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock fetch for Turnstile verification
const mockFetch = vi.fn();
global.fetch = mockFetch;

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

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

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("contact.submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful Turnstile verification
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
  });

  it("allows public users to submit contact form with valid turnstile token", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contact.submit({
      name: "測試使用者",
      email: "test@example.com",
      phone: "0912345678",
      inquiryType: "enterprise",
      message: "這是一個測試訊息，用於驗證聯絡表單功能是否正常運作。",
      turnstileToken: "test-token-123",
    });

    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({
        method: "POST",
      })
    );
  }, 30000);

  it("rejects submission with invalid turnstile token", async () => {
    // Mock failed Turnstile verification
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: false }),
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contact.submit({
        name: "測試使用者",
        email: "test@example.com",
        phone: "0912345678",
        inquiryType: "enterprise",
        message: "這是一個測試訊息，用於驗證聯絡表單功能是否正常運作。",
        turnstileToken: "invalid-token",
      })
    ).rejects.toThrow("人機驗證失敗");
  });

  it("validates required turnstile token", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contact.submit({
        name: "測試使用者",
        email: "test@example.com",
        inquiryType: "enterprise",
        message: "這是一個測試訊息，用於驗證聯絡表單功能是否正常運作。",
        // Missing turnstileToken
      } as any)
    ).rejects.toThrow();
  });

  it("validates required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contact.submit({
        name: "",
        email: "test@example.com",
        inquiryType: "enterprise",
        message: "測試訊息",
        turnstileToken: "test-token",
      })
    ).rejects.toThrow();
  });

  it("validates email format", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contact.submit({
        name: "測試使用者",
        email: "invalid-email",
        inquiryType: "enterprise",
        message: "這是一個測試訊息",
        turnstileToken: "test-token",
      })
    ).rejects.toThrow();
  });

  it("validates message length", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contact.submit({
        name: "測試使用者",
        email: "test@example.com",
        inquiryType: "enterprise",
        message: "短訊息",
        turnstileToken: "test-token",
      })
    ).rejects.toThrow();
  });
});

describe("contact admin procedures", () => {
  it("allows admin to get all contacts", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contact.getAll({ limit: 10 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("prevents non-admin from accessing admin procedures", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contact.getAll({ limit: 10 })
    ).rejects.toThrow();
  });
});
