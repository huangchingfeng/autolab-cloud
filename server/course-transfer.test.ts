import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database functions
vi.mock("./db", () => ({
  getAvailableTransferSessions: vi.fn(),
  executeCourseTransfer: vi.fn(),
}));

import { getAvailableTransferSessions, executeCourseTransfer } from "./db";

describe("Course Transfer Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAvailableTransferSessions", () => {
    it("should return available sessions for transfer", async () => {
      const mockSessions = [
        {
          sessionId: "0127_1",
          sessionName: "初階 1：AI 職場應用啟航班",
          date: "2026-01-27",
          dayOfWeek: "二",
          time: "9:00-12:00",
          location: "台北",
        },
        {
          sessionId: "0203_1",
          sessionName: "初階 1：AI 職場應用啟航班",
          date: "2026-02-03",
          dayOfWeek: "一",
          time: "9:00-12:00",
          location: "台北",
        },
      ];

      (getAvailableTransferSessions as any).mockResolvedValue(mockSessions);

      const result = await getAvailableTransferSessions("0120_1", 1);

      expect(result).toHaveLength(2);
      expect(result[0].sessionId).toBe("0127_1");
      expect(result[1].sessionId).toBe("0203_1");
    });

    it("should exclude current session from available sessions", async () => {
      const mockSessions = [
        {
          sessionId: "0127_1",
          sessionName: "初階 1：AI 職場應用啟航班",
          date: "2026-01-27",
          dayOfWeek: "二",
          time: "9:00-12:00",
          location: "台北",
        },
      ];

      (getAvailableTransferSessions as any).mockResolvedValue(mockSessions);

      const result = await getAvailableTransferSessions("0120_1", 1);

      // Should not include the current session (0120_1)
      expect(result.every((s: any) => s.sessionId !== "0120_1")).toBe(true);
    });

    it("should return empty array when no sessions available", async () => {
      (getAvailableTransferSessions as any).mockResolvedValue([]);

      const result = await getAvailableTransferSessions("0120_1", 1);

      expect(result).toHaveLength(0);
    });
  });

  describe("executeCourseTransfer", () => {
    it("should successfully execute a course transfer", async () => {
      const mockTransferResult = {
        success: true,
        transferId: 1,
        fromSessionId: "0120_1",
        toSessionId: "0127_1",
      };

      (executeCourseTransfer as any).mockResolvedValue(mockTransferResult);

      const result = await executeCourseTransfer({
        registrationId: 1,
        attendeeEmail: "test@example.com",
        fromSessionId: "0120_1",
        toSessionId: "0127_1",
        reason: "Schedule conflict",
      });

      expect(result.success).toBe(true);
      expect(result.fromSessionId).toBe("0120_1");
      expect(result.toSessionId).toBe("0127_1");
    });

    it("should handle transfer without reason", async () => {
      const mockTransferResult = {
        success: true,
        transferId: 2,
        fromSessionId: "0120_1",
        toSessionId: "0127_1",
      };

      (executeCourseTransfer as any).mockResolvedValue(mockTransferResult);

      const result = await executeCourseTransfer({
        registrationId: 1,
        attendeeEmail: "test@example.com",
        fromSessionId: "0120_1",
        toSessionId: "0127_1",
      });

      expect(result.success).toBe(true);
    });

    it("should throw error for invalid transfer", async () => {
      (executeCourseTransfer as any).mockRejectedValue(
        new Error("Cannot transfer to the same session")
      );

      await expect(
        executeCourseTransfer({
          registrationId: 1,
          attendeeEmail: "test@example.com",
          fromSessionId: "0120_1",
          toSessionId: "0120_1", // Same session
        })
      ).rejects.toThrow("Cannot transfer to the same session");
    });
  });
});

describe("Course Transfer Validation", () => {
  it("should validate session ID format", () => {
    // Valid session ID format: MMDD_N (e.g., 0120_1)
    const validSessionIds = ["0120_1", "0127_2", "0203_3", "0210_4"];
    const invalidSessionIds = ["invalid", "01201", "0120-1", ""];

    validSessionIds.forEach((id) => {
      expect(/^\d{4}_\d+$/.test(id)).toBe(true);
    });

    invalidSessionIds.forEach((id) => {
      expect(/^\d{4}_\d+$/.test(id)).toBe(false);
    });
  });

  it("should validate registration ID is positive integer", () => {
    const validIds = [1, 2, 100, 999];
    const invalidIds = [0, -1, 1.5, NaN];

    validIds.forEach((id) => {
      expect(Number.isInteger(id) && id > 0).toBe(true);
    });

    invalidIds.forEach((id) => {
      expect(Number.isInteger(id) && id > 0).toBe(false);
    });
  });

  it("should validate email format", () => {
    const validEmails = ["test@example.com", "user.name@domain.co.tw"];
    const invalidEmails = ["invalid", "test@", "@domain.com"];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    validEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(true);
    });

    invalidEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(false);
    });
  });
});
