import { describe, it, expect } from "vitest";

describe("Invoice Fields for Course 2026 Registration", () => {
  describe("Tax ID Validation", () => {
    it("should accept valid 8-digit tax ID", () => {
      const validTaxIds = ["12345678", "00000001", "99999999"];
      validTaxIds.forEach((taxId) => {
        expect(/^\d{8}$/.test(taxId)).toBe(true);
      });
    });

    it("should reject invalid tax IDs", () => {
      const invalidTaxIds = [
        "1234567",   // 7 digits
        "123456789", // 9 digits
        "1234567a",  // contains letter
        "12-34-56",  // contains dashes
        "",          // empty
      ];
      invalidTaxIds.forEach((taxId) => {
        expect(/^\d{8}$/.test(taxId)).toBe(false);
      });
    });
  });

  describe("Invoice Data Structure", () => {
    it("should have correct invoice fields in registration data", () => {
      const registrationData = {
        needInvoice: true,
        taxId: "12345678",
        invoiceTitle: "測試公司股份有限公司",
      };

      expect(registrationData).toHaveProperty("needInvoice");
      expect(registrationData).toHaveProperty("taxId");
      expect(registrationData).toHaveProperty("invoiceTitle");
      expect(typeof registrationData.needInvoice).toBe("boolean");
      expect(typeof registrationData.taxId).toBe("string");
      expect(typeof registrationData.invoiceTitle).toBe("string");
    });

    it("should allow empty invoice fields when needInvoice is false", () => {
      const registrationData = {
        needInvoice: false,
        taxId: undefined,
        invoiceTitle: undefined,
      };

      expect(registrationData.needInvoice).toBe(false);
      expect(registrationData.taxId).toBeUndefined();
      expect(registrationData.invoiceTitle).toBeUndefined();
    });

    it("should require taxId and invoiceTitle when needInvoice is true", () => {
      const validateInvoiceFields = (data: {
        needInvoice: boolean;
        taxId?: string;
        invoiceTitle?: string;
      }) => {
        if (data.needInvoice) {
          if (!data.taxId || !/^\d{8}$/.test(data.taxId)) {
            return { valid: false, error: "統一編號必須為 8 位數字" };
          }
          if (!data.invoiceTitle || data.invoiceTitle.trim() === "") {
            return { valid: false, error: "請輸入發票抬頭" };
          }
        }
        return { valid: true };
      };

      // Valid case
      expect(
        validateInvoiceFields({
          needInvoice: true,
          taxId: "12345678",
          invoiceTitle: "測試公司",
        })
      ).toEqual({ valid: true });

      // Invalid: missing taxId
      expect(
        validateInvoiceFields({
          needInvoice: true,
          taxId: undefined,
          invoiceTitle: "測試公司",
        })
      ).toEqual({ valid: false, error: "統一編號必須為 8 位數字" });

      // Invalid: missing invoiceTitle
      expect(
        validateInvoiceFields({
          needInvoice: true,
          taxId: "12345678",
          invoiceTitle: "",
        })
      ).toEqual({ valid: false, error: "請輸入發票抬頭" });

      // Valid: needInvoice is false, no validation needed
      expect(
        validateInvoiceFields({
          needInvoice: false,
          taxId: undefined,
          invoiceTitle: undefined,
        })
      ).toEqual({ valid: true });
    });
  });
});
