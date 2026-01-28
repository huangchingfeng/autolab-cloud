import { describe, it, expect } from 'vitest';
import { validateNewebpayConfig, createPaymentData } from './_core/newebpay';

describe('Newebpay Integration', () => {
  it('should have valid newebpay configuration', () => {
    const result = validateNewebpayConfig();
    expect(result.valid).toBe(true);
    expect(result.message).toBe('Newebpay configuration is valid');
  });

  it('should create valid payment data structure', () => {
    const paymentData = createPaymentData({
      orderId: 'TEST' + Date.now(),
      amount: 1,
      itemDesc: 'Test Item',
      email: 'test@example.com',
      returnUrl: 'https://example.com/return',
      notifyUrl: 'https://example.com/notify',
    });

    expect(paymentData).toHaveProperty('MerchantID');
    expect(paymentData).toHaveProperty('TradeInfo');
    expect(paymentData).toHaveProperty('TradeSha');
    expect(paymentData).toHaveProperty('Version', '2.0');
    expect(paymentData).toHaveProperty('PayGateWay');
    expect(paymentData.TradeInfo).toBeTruthy();
    expect(paymentData.TradeSha).toBeTruthy();
  });
});
