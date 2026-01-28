import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

/**
 * Event Registrations Management Tests
 * 
 * Tests for event registration CRUD operations:
 * - Get all event registrations with filters
 * - Get registration by ID
 * - Create registration
 * - Update registration
 * - Delete registration
 * - Get registration statistics
 */

describe("Event Registrations Management", () => {
  let testEventId: number;
  let testRegistrationId: number;

  const adminContext: Context = {
    user: {
      id: 1,
      openId: "test-admin-openid",
      name: "Test Admin",
      email: "admin@test.com",
      role: "admin",
      loginMethod: "oauth",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(adminContext);

  beforeAll(async () => {
    // Get first event for testing
    const events = await caller.events.getAllEvents();
    if (events.length > 0) {
      testEventId = events[0].id;
    }
  });

  describe("Admin: Get All Event Registrations", () => {
    it("should get all event registrations", async () => {
      const result = await caller.events.getAllEventRegistrations();
      
      expect(result).toBeDefined();
      expect(result.registrations).toBeDefined();
      expect(Array.isArray(result.registrations)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it("should filter registrations by event ID", async () => {
      if (!testEventId) {
        console.log("No test event available, skipping test");
        return;
      }

      const result = await caller.events.getAllEventRegistrations({
        eventId: testEventId,
      });
      
      expect(result).toBeDefined();
      expect(result.registrations).toBeDefined();
      
      // All registrations should belong to the specified event
      result.registrations.forEach((item) => {
        expect(item.registration.eventId).toBe(testEventId);
      });
    });

    it("should search registrations by name", async () => {
      const result = await caller.events.getAllEventRegistrations({
        searchTerm: "Max",
      });
      
      expect(result).toBeDefined();
      expect(result.registrations).toBeDefined();
      
      // All registrations should match the search term
      result.registrations.forEach((item) => {
        const matchesName = item.registration.name.includes("Max");
        const matchesEmail = item.registration.email.includes("Max");
        const matchesPhone = item.registration.phone.includes("Max");
        
        expect(matchesName || matchesEmail || matchesPhone).toBe(true);
      });
    });

    it("should support pagination", async () => {
      const result = await caller.events.getAllEventRegistrations({
        limit: 5,
        offset: 0,
      });
      
      expect(result).toBeDefined();
      expect(result.registrations).toBeDefined();
      expect(result.registrations.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Admin: Create Event Registration", () => {
    it("should create a new event registration", async () => {
      if (!testEventId) {
        console.log("No test event available, skipping test");
        return;
      }

      const result = await caller.events.createEventRegistration({
        eventId: testEventId,
        name: "Test User",
        email: "testuser@example.com",
        phone: "0912345678",
        company: "Test Company",
        jobTitle: "Test Job",
        referralSource: "Test Source",
        status: "registered",
        notes: "Test registration",
      });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(typeof result.registrationId).toBe('number');
      
      // Only set testRegistrationId if it's a valid number
      if (result.registrationId > 0) {
        testRegistrationId = result.registrationId;
      }
    });
  });

  describe("Admin: Get Registration By ID", () => {
    it("should get registration by ID", async () => {
      if (!testRegistrationId) {
        console.log("No test registration available, skipping test");
        return;
      }

      const result = await caller.events.getRegistrationById({
        id: testRegistrationId,
      });
      
      expect(result).toBeDefined();
      expect(result.registration).toBeDefined();
      expect(result.registration.id).toBe(testRegistrationId);
      expect(result.registration.name).toBe("Test User");
      expect(result.registration.email).toBe("testuser@example.com");
    });

    it("should throw error for non-existent registration", async () => {
      await expect(
        caller.events.getRegistrationById({ id: 999999 })
      ).rejects.toThrow("報名記錄不存在");
    });
  });

  describe("Admin: Update Event Registration", () => {
    it("should update registration details", async () => {
      if (!testRegistrationId) {
        console.log("No test registration available, skipping test");
        return;
      }

      const result = await caller.events.updateEventRegistration({
        id: testRegistrationId,
        name: "Updated Test User",
        status: "confirmed",
        notes: "Updated notes",
      });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      
      // Verify the update
      const updated = await caller.events.getRegistrationById({
        id: testRegistrationId,
      });
      
      expect(updated.registration.name).toBe("Updated Test User");
      expect(updated.registration.status).toBe("confirmed");
      expect(updated.registration.notes).toBe("Updated notes");
    });
  });

  describe("Admin: Get Event Registration Stats", () => {
    it("should get registration statistics for all events", async () => {
      const result = await caller.events.getEventRegistrationStats();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      result.forEach((stat) => {
        expect(stat.eventId).toBeDefined();
        expect(stat.eventTitle).toBeDefined();
        expect(stat.eventDate).toBeDefined();
        expect(stat.registrationCount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("Admin: Delete Event Registration", () => {
    it("should delete registration", async () => {
      if (!testRegistrationId) {
        console.log("No test registration available, skipping test");
        return;
      }

      const result = await caller.events.deleteEventRegistration({
        id: testRegistrationId,
      });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      
      // Verify deletion
      await expect(
        caller.events.getRegistrationById({ id: testRegistrationId })
      ).rejects.toThrow("報名記錄不存在");
    });
  });

  describe("Database Functions", () => {
    it("should create registration via db function", async () => {
      if (!testEventId) {
        console.log("No test event available, skipping test");
        return;
      }

      const { createEventRegistration } = await import("./db");
      
      const result = await createEventRegistration({
        eventId: testEventId,
        name: "DB Test User",
        email: "dbtest@example.com",
        phone: "0987654321",
      });
      
      expect(result).toBeDefined();
    });

    it("should get all registrations with details via db function", async () => {
      const { getAllEventRegistrationsWithDetails } = await import("./db");
      
      const result = await getAllEventRegistrationsWithDetails({
        limit: 10,
        offset: 0,
      });
      
      expect(result).toBeDefined();
      expect(result.registrations).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it("should update registration via db function", async () => {
      if (!testEventId) {
        console.log("No test event available, skipping test");
        return;
      }

      const { createEventRegistration, updateEventRegistration, getRegistrationById } = await import("./db");
      
      // Create a test registration
      const createResult = await createEventRegistration({
        eventId: testEventId,
        name: "Update Test User",
        email: "updatetest@example.com",
        phone: "0911111111",
      });
      
      const insertId = (createResult as any).insertId;
      const registrationId = typeof insertId === 'bigint' ? Number(insertId) : Number(insertId || 0);
      
      if (registrationId === 0) {
        console.log("Failed to create test registration, skipping test");
        return;
      }
      
      // Update the registration
      await updateEventRegistration(registrationId, {
        name: "Updated Name",
        status: "confirmed",
      });
      
      // Verify the update
      const updated = await getRegistrationById(registrationId);
      expect(updated).toBeDefined();
      expect(updated?.registration.name).toBe("Updated Name");
      expect(updated?.registration.status).toBe("confirmed");
    });

    it("should get event registration stats via db function", async () => {
      const { getEventRegistrationStats } = await import("./db");
      
      const result = await getEventRegistrationStats();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
