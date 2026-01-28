import { describe, it, expect, beforeAll } from 'vitest';
import { ENV } from './_core/env';
import { createPaymentData, verifyPaymentCallback } from './_core/newebpay';

describe('Newebpay Integration', () => {
  const hasNewebpayConfig = ENV.NEWEBPAY_MERCHANT_ID && ENV.NEWEBPAY_HASH_KEY && ENV.NEWEBPAY_HASH_IV;

  it.skipIf(!hasNewebpayConfig)('should have Newebpay credentials configured', () => {
    expect(ENV.NEWEBPAY_MERCHANT_ID).toBeDefined();
    expect(ENV.NEWEBPAY_HASH_KEY).toBeDefined();
    expect(ENV.NEWEBPAY_HASH_IV).toBeDefined();
  });

  describe('createPaymentData', () => {
    it.skipIf(!hasNewebpayConfig)('should create valid payment data with required fields', () => {
      const paymentData = createPaymentData({
        orderId: 'TEST123456',
        amount: 100,
        itemDesc: 'Test Course',
        email: 'test@example.com',
        returnUrl: 'https://example.com/return',
        notifyUrl: 'https://example.com/notify',
        clientBackUrl: 'https://example.com/back',
      });

      expect(paymentData).toHaveProperty('MerchantID');
      expect(paymentData).toHaveProperty('TradeInfo');
      expect(paymentData).toHaveProperty('TradeSha');
      expect(paymentData).toHaveProperty('Version');
      expect(paymentData).toHaveProperty('PayGateWay');
      expect(paymentData.MerchantID).toBe(ENV.NEWEBPAY_MERCHANT_ID);
      expect(paymentData.Version).toBe('2.0');
    });

    it.skipIf(!hasNewebpayConfig)('should handle different amounts correctly', () => {
      const paymentData1 = createPaymentData({
        orderId: 'TEST1',
        amount: 1,
        itemDesc: 'Test',
        email: 'test@example.com',
        returnUrl: 'https://example.com/return',
        notifyUrl: 'https://example.com/notify',
        clientBackUrl: 'https://example.com/back',
      });

      const paymentData699 = createPaymentData({
        orderId: 'TEST699',
        amount: 699,
        itemDesc: 'Test',
        email: 'test@example.com',
        returnUrl: 'https://example.com/return',
        notifyUrl: 'https://example.com/notify',
        clientBackUrl: 'https://example.com/back',
      });

      // Both should generate valid data
      expect(paymentData1.TradeInfo).toBeDefined();
      expect(paymentData699.TradeInfo).toBeDefined();
      // TradeInfo should be different for different amounts
      expect(paymentData1.TradeInfo).not.toBe(paymentData699.TradeInfo);
    });
  });
});

describe('Promo Code Validation', () => {
  it('should calculate percentage discount correctly', async () => {
    const { calculateDiscount } = await import('./db');
    
    // 10% off on 1000
    const discount10 = calculateDiscount(1000, { discountType: 'percentage', discountValue: 10 });
    expect(discount10).toBe(100);
    
    // 50% off on 699
    const discount50 = calculateDiscount(699, { discountType: 'percentage', discountValue: 50 });
    expect(discount50).toBe(349); // Math.floor(699 * 0.5)
  });

  it('should calculate fixed discount correctly', async () => {
    const { calculateDiscount } = await import('./db');
    
    // Fixed 100 off on 1000
    const discount100 = calculateDiscount(1000, { discountType: 'fixed', discountValue: 100 });
    expect(discount100).toBe(100);
    
    // Fixed 500 off on 300 (should cap at original amount)
    const discountCapped = calculateDiscount(300, { discountType: 'fixed', discountValue: 500 });
    expect(discountCapped).toBe(300);
  });
});
