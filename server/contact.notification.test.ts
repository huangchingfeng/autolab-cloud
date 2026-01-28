import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import * as notification from "./_core/notification";

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock fetch for Turnstile verification
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Contact Form Email Notification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful Turnstile verification
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
  });

  it("should send email notification when contact form is submitted", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const contactData = {
      name: "測試用戶",
      email: "test@example.com",
      phone: "0912345678",
      inquiryType: "enterprise" as const,
      message: "這是一個測試訊息，用於驗證 Email 通知功能是否正常運作。",
      turnstileToken: "test-token-123",
    };

    const result = await caller.contact.submit(contactData);

    expect(result.success).toBe(true);
    expect(notification.notifyOwner).toHaveBeenCalledTimes(1);
    expect(notification.notifyOwner).toHaveBeenCalledWith({
      title: `新的聯絡表單提交：${contactData.name}`,
      content: expect.stringContaining(contactData.name),
    });
    expect(notification.notifyOwner).toHaveBeenCalledWith({
      title: expect.any(String),
      content: expect.stringContaining(contactData.email),
    });
    expect(notification.notifyOwner).toHaveBeenCalledWith({
      title: expect.any(String),
      content: expect.stringContaining(contactData.phone),
    });
    expect(notification.notifyOwner).toHaveBeenCalledWith({
      title: expect.any(String),
      content: expect.stringContaining("企業內訓"),
    });
    expect(notification.notifyOwner).toHaveBeenCalledWith({
      title: expect.any(String),
      content: expect.stringContaining(contactData.message),
    });
  });

  it("should handle missing phone number gracefully", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const contactData = {
      name: "測試用戶2",
      email: "test2@example.com",
      inquiryType: "public" as const,
      message: "這是另一個測試訊息，沒有提供電話號碼。",
      turnstileToken: "test-token-456",
    };

    const result = await caller.contact.submit(contactData);

    expect(result.success).toBe(true);
    expect(notification.notifyOwner).toHaveBeenCalledWith({
      title: expect.any(String),
      content: expect.stringContaining("未提供"),
    });
    expect(notification.notifyOwner).toHaveBeenCalledWith({
      title: expect.any(String),
      content: expect.stringContaining("公開課"),
    });
  });

  it("should map inquiry types correctly", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const inquiryTypes = [
      { type: "enterprise" as const, expected: "企業內訓" },
      { type: "public" as const, expected: "公開課" },
      { type: "coaching" as const, expected: "1對1教學" },
      { type: "other" as const, expected: "其他" },
    ];

    for (const { type, expected } of inquiryTypes) {
      vi.clearAllMocks();
      // Reset mock for each iteration
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });
      
      await caller.contact.submit({
        name: "測試",
        email: "test@example.com",
        inquiryType: type,
        message: "測試訊息內容測試訊息內容",
        turnstileToken: "test-token-789",
      });

      expect(notification.notifyOwner).toHaveBeenCalledWith({
        title: expect.any(String),
        content: expect.stringContaining(expected),
      });
    }
  });
});
