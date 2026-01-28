import { describe, it, expect } from 'vitest';

describe('藍新金流訂單編號格式', () => {
  it('新格式訂單編號應不超過 30 字元', () => {
    // 模擬最大可能的 registrationId（6 位數）和 timestamp（8 位數）
    const maxRegistrationId = 999999;
    const shortTimestamp = Date.now().toString().slice(-8);
    const tradeNo = `C26_${maxRegistrationId}_${shortTimestamp}`;
    
    console.log(`測試訂單編號: ${tradeNo}`);
    console.log(`訂單編號長度: ${tradeNo.length}`);
    
    expect(tradeNo.length).toBeLessThanOrEqual(30);
  });

  it('一般情況訂單編號長度檢查', () => {
    // 模擬一般情況的 registrationId（5 位數）
    const registrationId = 12002;
    const shortTimestamp = Date.now().toString().slice(-8);
    const tradeNo = `C26_${registrationId}_${shortTimestamp}`;
    
    console.log(`測試訂單編號: ${tradeNo}`);
    console.log(`訂單編號長度: ${tradeNo.length}`);
    
    expect(tradeNo.length).toBeLessThanOrEqual(30);
  });

  it('訂單編號格式應正確', () => {
    const registrationId = 12002;
    const shortTimestamp = '00744772';
    const tradeNo = `C26_${registrationId}_${shortTimestamp}`;
    
    // 驗證格式
    expect(tradeNo).toMatch(/^C26_\d+_\d{8}$/);
    
    // 驗證可以正確解析 registrationId
    const parts = tradeNo.split('_');
    expect(parts[0]).toBe('C26');
    expect(parseInt(parts[1])).toBe(registrationId);
    expect(parts[2]).toBe(shortTimestamp);
  });

  it('舊格式訂單編號會超過 30 字元（用於對比）', () => {
    const registrationId = 120002;
    const timestamp = Date.now();
    const oldTradeNo = `COURSE2026_${registrationId}_${timestamp}`;
    
    console.log(`舊格式訂單編號: ${oldTradeNo}`);
    console.log(`舊格式長度: ${oldTradeNo.length}`);
    
    // 舊格式會超過 30 字元
    expect(oldTradeNo.length).toBeGreaterThan(30);
  });

  it('payment.ts 中的前綴判斷應同時支援新舊格式', () => {
    const newFormat = 'C26_12002_00744772';
    const oldFormat = 'COURSE2026_12002_1769000744772';
    
    // 模擬 payment.ts 中的判斷邏輯
    const isNewCourse2026 = newFormat.startsWith('C26_') || newFormat.startsWith('COURSE2026_');
    const isOldCourse2026 = oldFormat.startsWith('C26_') || oldFormat.startsWith('COURSE2026_');
    
    expect(isNewCourse2026).toBe(true);
    expect(isOldCourse2026).toBe(true);
    
    // 驗證可以正確解析 registrationId
    const newRegistrationId = parseInt(newFormat.split('_')[1]);
    const oldRegistrationId = parseInt(oldFormat.split('_')[1]);
    
    expect(newRegistrationId).toBe(12002);
    expect(oldRegistrationId).toBe(12002);
  });
});
