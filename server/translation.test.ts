import { describe, it, expect } from "vitest";
import { translateText } from "./translation";

describe("Translation API", () => {
  it("should translate text to English", async () => {
    const result = await translateText("你好，世界", "en");
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
    // Should contain "hello" or "world" in some form
    expect(result.toLowerCase()).toMatch(/hello|world/);
  }, 30000); // 30 second timeout for API call

  it("should translate text to Simplified Chinese", async () => {
    const result = await translateText("繁體中文測試", "zh-CN");
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  }, 30000);

  it("should return original text for zh-TW target", async () => {
    const originalText = "這是測試文字";
    const result = await translateText(originalText, "zh-TW");
    expect(result).toBe(originalText);
  });

  it("should handle empty string", async () => {
    const result = await translateText("", "en");
    expect(result).toBe("");
  });
});
