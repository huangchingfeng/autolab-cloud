import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the ENV module
vi.mock("./_core/env", () => ({
  ENV: {
    makeWebhookUrl: "https://hook.make.com/test-webhook-url",
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Make.com Webhook Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sendToMakeWebhook", () => {
    it("should send subscriber data to Make.com webhook", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const { sendToMakeWebhook } = await import("./_core/makeWebhook");

      const result = await sendToMakeWebhook({
        email: "test@example.com",
        name: "測試用戶",
        source: "course_2026",
        timestamp: "2026-01-22T12:00:00.000Z",
        metadata: {
          plan: "full",
        },
      });

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://hook.make.com/test-webhook-url",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.stringContaining("test@example.com"),
        })
      );
    });

    it("should include event type in the payload", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const { sendToMakeWebhook } = await import("./_core/makeWebhook");

      await sendToMakeWebhook({
        email: "test@example.com",
        name: "測試用戶",
        source: "course_2026",
        timestamp: "2026-01-22T12:00:00.000Z",
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.event).toBe("newsletter_subscribe");
    });

    it("should return false when webhook URL is not configured", async () => {
      // Re-mock with empty URL
      vi.doMock("./_core/env", () => ({
        ENV: {
          makeWebhookUrl: "",
        },
      }));

      // Clear the module cache and re-import
      vi.resetModules();
      const { sendToMakeWebhook } = await import("./_core/makeWebhook");

      const result = await sendToMakeWebhook({
        email: "test@example.com",
        name: "測試用戶",
        source: "course_2026",
        timestamp: "2026-01-22T12:00:00.000Z",
      });

      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should return false when webhook request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      // Reset to use configured URL
      vi.doMock("./_core/env", () => ({
        ENV: {
          makeWebhookUrl: "https://hook.make.com/test-webhook-url",
        },
      }));

      vi.resetModules();
      const { sendToMakeWebhook } = await import("./_core/makeWebhook");

      const result = await sendToMakeWebhook({
        email: "test@example.com",
        name: "測試用戶",
        source: "course_2026",
        timestamp: "2026-01-22T12:00:00.000Z",
      });

      expect(result).toBe(false);
    });

    it("should handle network errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      vi.doMock("./_core/env", () => ({
        ENV: {
          makeWebhookUrl: "https://hook.make.com/test-webhook-url",
        },
      }));

      vi.resetModules();
      const { sendToMakeWebhook } = await import("./_core/makeWebhook");

      const result = await sendToMakeWebhook({
        email: "test@example.com",
        name: "測試用戶",
        source: "course_2026",
        timestamp: "2026-01-22T12:00:00.000Z",
      });

      expect(result).toBe(false);
    });
  });

  describe("sendBatchToMakeWebhook", () => {
    it("should send multiple subscribers and return success/failed counts", async () => {
      // First two succeed, third fails
      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: "Error" });

      vi.doMock("./_core/env", () => ({
        ENV: {
          makeWebhookUrl: "https://hook.make.com/test-webhook-url",
        },
      }));

      vi.resetModules();
      const { sendBatchToMakeWebhook } = await import("./_core/makeWebhook");

      const result = await sendBatchToMakeWebhook([
        {
          email: "user1@example.com",
          name: "用戶1",
          source: "course_2026",
          timestamp: "2026-01-22T12:00:00.000Z",
        },
        {
          email: "user2@example.com",
          name: "用戶2",
          source: "course_2026",
          timestamp: "2026-01-22T12:00:00.000Z",
        },
        {
          email: "user3@example.com",
          name: "用戶3",
          source: "course_2026",
          timestamp: "2026-01-22T12:00:00.000Z",
        },
      ]);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("Newsletter subscription field in registration", () => {
    it("should include subscribeNewsletter field in course registration schema", async () => {
      // This test verifies the schema includes the field
      const { courseRegistrations2026 } = await import("../drizzle/schema");
      
      // Check that the table has subscribeNewsletter column
      expect(courseRegistrations2026).toBeDefined();
      // The column should exist in the schema
      expect(courseRegistrations2026.subscribeNewsletter).toBeDefined();
    });

    it("should include subscribeNewsletter field in event registration schema", async () => {
      const { eventRegistrations } = await import("../drizzle/schema");
      
      expect(eventRegistrations).toBeDefined();
      expect(eventRegistrations.subscribeNewsletter).toBeDefined();
    });
  });
});
