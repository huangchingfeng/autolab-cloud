import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Notifications System", () => {
  let testNotificationId: number;
  let testUserId = 1; // 假設測試用戶 ID 為 1

  // 建立測試用的 tRPC caller
  const createCaller = (userId?: number, role: "user" | "admin" = "admin") => {
    return appRouter.createCaller({
      user: userId
        ? {
            id: userId,
            openId: `test-user-${userId}`,
            name: `Test User ${userId}`,
            email: `test${userId}@example.com`,
            role,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastSignedIn: new Date(),
            loginMethod: "test",
          }
        : null,
      req: {} as any,
      res: {} as any,
    });
  };

  describe("Admin: Create Notification", () => {
    it("should create a notification for all users", async () => {
      const caller = createCaller(1, "admin");

      const result = await caller.notifications.createNotification({
        title: "測試通知：全站公告",
        content: "這是一則測試通知，發送給所有用戶",
        type: "info",
        targetType: "all",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeTypeOf("number");
      expect(result.title).toBe("測試通知：全站公告");
      
      testNotificationId = result.id;
    });

    it("should create a notification for specific user", async () => {
      const caller = createCaller(1, "admin");

      const result = await caller.notifications.createNotification({
        title: "測試通知：個人通知",
        content: "這是一則發送給特定用戶的通知",
        type: "success",
        targetType: "user",
        targetUserId: testUserId,
      });

      expect(result).toBeDefined();
      expect(result.targetUserId).toBe(testUserId);
    });

    it("should create a notification for specific role", async () => {
      const caller = createCaller(1, "admin");

      const result = await caller.notifications.createNotification({
        title: "測試通知：管理員通知",
        content: "這是一則發送給管理員的通知",
        type: "warning",
        targetType: "role",
        targetRole: "admin",
      });

      expect(result).toBeDefined();
      expect(result.targetRole).toBe("admin");
    });

    it("should fail if non-admin tries to create notification", async () => {
      const caller = createCaller(2, "user");

      await expect(
        caller.notifications.createNotification({
          title: "測試通知",
          content: "這應該失敗",
          type: "info",
          targetType: "all",
        })
      ).rejects.toThrow();
    });
  });

  describe("Admin: Get All Notifications", () => {
    it("should get all notifications", async () => {
      const caller = createCaller(1, "admin");

      const result = await caller.notifications.getAllNotifications({
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.notifications).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThan(0);
    });
  });

  describe("User: Get User Notifications", () => {
    it("should get notifications for authenticated user", async () => {
      const caller = createCaller(testUserId, "user");

      const result = await caller.notifications.getUserNotifications({
        limit: 10,
        offset: 0,
      });

      expect(result).toBeInstanceOf(Array);
      // 應該包含 "all" 類型的通知
      const hasAllNotification = result.some(
        (n: any) => n.title === "測試通知：全站公告"
      );
      expect(hasAllNotification).toBe(true);
    });

    it("should get unread count", async () => {
      const caller = createCaller(testUserId, "user");

      const result = await caller.notifications.getUnreadCount();

      expect(result).toBeDefined();
      expect(result.count).toBeTypeOf("number");
      expect(result.count).toBeGreaterThan(0);
    });
  });

  describe("User: Mark Notification as Read", () => {
    it("should mark notification as read", async () => {
      const caller = createCaller(testUserId, "user");

      // 先獲取未讀數量
      const beforeCount = await caller.notifications.getUnreadCount();

      // 標記為已讀
      const result = await caller.notifications.markAsRead({
        notificationId: testNotificationId,
      });

      expect(result.success).toBe(true);

      // 再次獲取未讀數量，應該減少
      const afterCount = await caller.notifications.getUnreadCount();
      expect(afterCount.count).toBeLessThanOrEqual(beforeCount.count);
    });

    it("should mark all notifications as read", async () => {
      const caller = createCaller(testUserId, "user");

      const result = await caller.notifications.markAllAsRead();

      expect(result.success).toBe(true);
      expect(result.markedCount).toBeTypeOf("number");

      // 檢查未讀數量應該為 0
      const unreadCount = await caller.notifications.getUnreadCount();
      expect(unreadCount.count).toBe(0);
    });
  });

  describe("Admin: Delete Notification", () => {
    it("should delete notification", async () => {
      const caller = createCaller(1, "admin");

      const result = await caller.notifications.deleteNotification({
        id: testNotificationId,
      });

      expect(result.success).toBe(true);

      // 驗證通知已被刪除
      const allNotifications = await caller.notifications.getAllNotifications({
        limit: 100,
        offset: 0,
      });

      const deletedNotification = allNotifications.notifications.find(
        (n: any) => n.id === testNotificationId
      );
      expect(deletedNotification).toBeUndefined();
    });

    it("should fail if non-admin tries to delete notification", async () => {
      const caller = createCaller(2, "user");

      await expect(
        caller.notifications.deleteNotification({ id: 999 })
      ).rejects.toThrow();
    });
  });

  describe("Database Functions", () => {
    it("should create notification via db function", async () => {
      const result = await db.createNotification({
        title: "直接資料庫測試",
        content: "測試直接調用資料庫函數",
        type: "info",
        targetType: "all",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeTypeOf("number");

      // 清理測試資料
      await db.deleteNotification(result.id);
    });

    it("should get user notifications via db function", async () => {
      const result = await db.getUserNotifications(testUserId, "user", 10, 0);

      expect(result).toBeInstanceOf(Array);
    });

    it("should get unread count via db function", async () => {
      const result = await db.getUnreadNotificationCount(testUserId, "user");

      expect(result).toBeDefined();
      expect(result.count).toBeTypeOf("number");
    });
  });
});
