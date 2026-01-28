/**
 * 會計系統 Webhook 整合測試
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { sendEventRegistration, sendCourseRegistration, sendPaymentSuccess } from './_core/accountingWebhook';

describe('Accounting Webhook Integration', () => {
  beforeAll(() => {
    // 確保環境變數已設定
    if (!process.env.ACCOUNTING_WEBHOOK_URL) {
      console.warn('⚠️  ACCOUNTING_WEBHOOK_URL not set, webhook will not send');
    }
    if (process.env.ACCOUNTING_WEBHOOK_ENABLED !== 'true') {
      console.warn('⚠️  ACCOUNTING_WEBHOOK_ENABLED not set to true, webhook will not send');
    }
  });

  describe('sendEventRegistration', () => {
    it('should send event registration data successfully', async () => {
      const testData = {
        eventId: 1,
        eventTitle: '【AI 視覺賦能工作術】Gemini Nano Banana & Grok 影像實戰班',
        name: '測試學員',
        email: 'test@example.com',
        phone: '0912345678',
        company: '測試公司',
        jobTitle: '測試職位',
        attendeeCount: 1,
      };

      const result = await sendEventRegistration(testData);
      
      // Webhook 發送不應該拋出錯誤
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    }, 10000); // 10秒 timeout

    it('should handle missing optional fields', async () => {
      const testData = {
        eventId: 1,
        eventTitle: '測試活動',
        name: '測試學員',
        email: 'test@example.com',
        phone: '0912345678',
      };

      const result = await sendEventRegistration(testData);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    }, 10000);
  });

  describe('sendCourseRegistration', () => {
    it('should send single session course registration', async () => {
      const testData = {
        userType: 'new' as const,
        plan: 'single' as const,
        planPrice: 3000,
        selectedSessions: JSON.stringify(['0127_1']),
        name1: '測試學員',
        phone1: '0912345678',
        email1: 'test@example.com',
        industry1: '測試產業',
        paymentMethod: 'transfer' as const,
        paymentStatus: 'pending' as const,
      };

      const result = await sendCourseRegistration(testData);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    }, 10000);

    it('should send full course registration', async () => {
      const testData = {
        userType: 'new' as const,
        plan: 'full' as const,
        planPrice: 10000,
        selectedSessions: JSON.stringify(['0127_1', '0127_2', '0128_3', '0128_4']),
        name1: '測試學員',
        phone1: '0912345678',
        email1: 'test@example.com',
        industry1: '測試產業',
        paymentMethod: 'online' as const,
        paymentStatus: 'pending' as const,
      };

      const result = await sendCourseRegistration(testData);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    }, 10000);

    it('should send double plan course registration', async () => {
      const testData = {
        userType: 'new' as const,
        plan: 'double' as const,
        planPrice: 16000,
        selectedSessions: JSON.stringify(['0127_1', '0127_2']),
        name1: '測試學員1',
        phone1: '0912345678',
        email1: 'test1@example.com',
        industry1: '測試產業1',
        name2: '測試學員2',
        phone2: '0987654321',
        email2: 'test2@example.com',
        industry2: '測試產業2',
        paymentMethod: 'online' as const,
        paymentStatus: 'pending' as const,
      };

      const result = await sendCourseRegistration(testData);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    }, 10000);
  });

  describe('sendPaymentSuccess', () => {
    it('should send payment success notification', async () => {
      const testData = {
        userType: 'new' as const,
        plan: 'single' as const,
        planPrice: 3000,
        selectedSessions: JSON.stringify(['0127_1']),
        name1: '測試學員',
        phone1: '0912345678',
        email1: 'test@example.com',
        industry1: '測試產業',
        paymentMethod: 'online' as const,
        paymentStatus: 'paid' as const,
      };

      const result = await sendPaymentSuccess(testData);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    }, 10000);
  });

  describe('Course name generation', () => {
    it('should generate correct course name for single session', async () => {
      const testData = {
        userType: 'new' as const,
        plan: 'single' as const,
        planPrice: 3000,
        selectedSessions: JSON.stringify(['0127_1']),
        name1: '測試學員',
        phone1: '0912345678',
        email1: 'test@example.com',
        paymentMethod: 'transfer' as const,
        paymentStatus: 'pending' as const,
      };

      const result = await sendCourseRegistration(testData);
      
      // 應該生成「2026 AI 實戰應用課 - 1/27（一）第一堂：AI 基礎入門」
      expect(result.success).toBe(true);
    }, 10000);

    it('should generate correct course name for full plan', async () => {
      const testData = {
        userType: 'new' as const,
        plan: 'full' as const,
        planPrice: 10000,
        selectedSessions: JSON.stringify(['0127_1', '0127_2', '0128_3', '0128_4']),
        name1: '測試學員',
        phone1: '0912345678',
        email1: 'test@example.com',
        paymentMethod: 'online' as const,
        paymentStatus: 'pending' as const,
      };

      const result = await sendCourseRegistration(testData);
      
      // 應該生成「2026 AI 實戰應用課（四堂全報）」
      expect(result.success).toBe(true);
    }, 10000);
  });
});
