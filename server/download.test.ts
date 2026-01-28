import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";

// Mock the database functions
vi.mock("./db", () => ({
  createDownloadLead: vi.fn().mockResolvedValue({ id: 1 }),
  getDownloadLeads: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      resourceSlug: "test-resource",
      resourceTitle: "Test Resource",
      downloadUrl: "https://example.com/test.pdf",
      createdAt: new Date(),
    },
  ]),
}));

// Mock the notification function
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("Download Router", () => {
  const createCaller = (user?: { id: number; role: string }) => {
    return appRouter.createCaller({
      user: user as any,
      req: {} as any,
      res: {
        clearCookie: vi.fn(),
      } as any,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should register a download lead successfully", async () => {
      const caller = createCaller();
      
      const result = await caller.download.register({
        name: "Test User",
        email: "test@example.com",
        resourceSlug: "google-gemini-3-guide",
        resourceTitle: "Gemini AI 菁英團隊戰略指南",
        downloadUrl: "https://example.com/gemini-guide.pdf",
      });

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe("https://example.com/gemini-guide.pdf");
      expect(result.leadId).toBe(1);
    });

    it("should reject invalid email", async () => {
      const caller = createCaller();
      
      await expect(
        caller.download.register({
          name: "Test User",
          email: "invalid-email",
          resourceSlug: "test-resource",
          resourceTitle: "Test Resource",
          downloadUrl: "https://example.com/test.pdf",
        })
      ).rejects.toThrow();
    });

    it("should reject empty name", async () => {
      const caller = createCaller();
      
      await expect(
        caller.download.register({
          name: "",
          email: "test@example.com",
          resourceSlug: "test-resource",
          resourceTitle: "Test Resource",
          downloadUrl: "https://example.com/test.pdf",
        })
      ).rejects.toThrow();
    });
  });

  describe("getLeads (admin only)", () => {
    it("should return download leads for admin", async () => {
      const caller = createCaller({ id: 1, role: "admin" });
      
      const result = await caller.download.getLeads({});

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Test User");
      expect(result[0].email).toBe("test@example.com");
    });

    it("should reject non-admin users", async () => {
      const caller = createCaller({ id: 2, role: "user" });
      
      await expect(caller.download.getLeads({})).rejects.toThrow("Admin access required");
    });

    it("should reject unauthenticated users", async () => {
      const caller = createCaller();
      
      await expect(caller.download.getLeads({})).rejects.toThrow();
    });
  });
});
