import { describe, it, expect } from "vitest";

describe("Turnstile Configuration", () => {
  it("should have TURNSTILE_SECRET_KEY configured", () => {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    expect(secretKey).toBeDefined();
    expect(secretKey).not.toBe("");
    // Turnstile keys start with 0x4
    expect(secretKey?.startsWith("0x4")).toBe(true);
  });

  it("should have VITE_TURNSTILE_SITE_KEY configured", () => {
    const siteKey = process.env.VITE_TURNSTILE_SITE_KEY;
    expect(siteKey).toBeDefined();
    expect(siteKey).not.toBe("");
    // Turnstile keys start with 0x4
    expect(siteKey?.startsWith("0x4")).toBe(true);
  });

  it("should be able to verify a test token with Turnstile API", async () => {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    
    // Use Cloudflare's test secret key for testing
    // In production, we use the real secret key
    const testSecretKey = "1x0000000000000000000000000000000AA"; // Always passes
    
    const formData = new URLSearchParams();
    formData.append("secret", testSecretKey);
    formData.append("response", "test-token");
    
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });
    
    const result = await response.json();
    
    // Test secret key should always return success
    expect(result.success).toBe(true);
  });
});
