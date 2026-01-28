import { describe, it, expect } from "vitest";
import { sendEmail, generateContactConfirmationEmail } from "./_core/email";

describe("Email Service", () => {
  it("should generate valid HTML email template", () => {
    const html = generateContactConfirmationEmail("測試用戶");
    
    expect(html).toContain("測試用戶");
    expect(html).toContain("感謝您的聯繫");
    expect(html).toContain("nikeshoxmiles@gmail.com");
    expect(html).toContain("0976-715-102");
    expect(html).toContain("1-2 個工作天");
  });

  it.skip("should send email successfully with valid API key", async () => {
    // Use the owner's email address (only verified email in Resend test mode)
    const result = await sendEmail({
      to: "nikeshoxmiles@gmail.com", // Owner's email (verified in Resend)
      subject: "測試郵件 - 聯絡表單自動回覆",
      html: generateContactConfirmationEmail("測試用戶"),
    });

    expect(result).toBe(true);
  }, 30000); // 30 second timeout for email sending
});
