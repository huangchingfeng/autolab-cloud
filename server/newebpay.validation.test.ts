import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

describe("Newebpay Configuration Validation", () => {
  it("should have newebpayMerchantId configured", () => {
    expect(ENV.newebpayMerchantId).toBeDefined();
    expect(ENV.newebpayMerchantId).not.toBe("");
    expect(ENV.newebpayMerchantId).toBe("312664199");
  });

  it("should have newebpayHashKey configured with correct length", () => {
    expect(ENV.newebpayHashKey).toBeDefined();
    expect(ENV.newebpayHashKey).not.toBe("");
    // HashKey should be 32 characters
    expect(ENV.newebpayHashKey.length).toBe(32);
  });

  it("should have newebpayHashIv configured with correct length", () => {
    expect(ENV.newebpayHashIv).toBeDefined();
    expect(ENV.newebpayHashIv).not.toBe("");
    // HashIV should be 16 characters
    expect(ENV.newebpayHashIv.length).toBe(16);
  });
});
