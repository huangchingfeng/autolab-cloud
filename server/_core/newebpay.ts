import crypto from 'crypto';
import { ENV } from './env';

// 統一使用正式環境 API
const NEWEBPAY_API_URL = 'https://core.newebpay.com/MPG/mpg_gateway';

interface CreatePaymentParams {
  orderId: string;
  amount: number;
  itemDesc: string;
  email: string;
  returnUrl: string;
  notifyUrl: string;
  clientBackUrl?: string;
}

interface TradeInfo {
  MerchantID: string;
  RespondType: string;
  TimeStamp: string;
  Version: string;
  MerchantOrderNo: string;
  Amt: number;
  ItemDesc: string;
  Email: string;
  ReturnURL: string;
  NotifyURL: string;
  ClientBackURL?: string;
  LoginType?: number;
}

// AES 加密
function aesEncrypt(data: string, key: string, iv: string): string {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// AES 解密
function aesDecrypt(encrypted: string, key: string, iv: string): string {
  try {
    // 確保 key 和 iv 長度正確
    if (key.length !== 32) {
      throw new Error(`Invalid key length: ${key.length}, expected 32`);
    }
    if (iv.length !== 16) {
      throw new Error(`Invalid IV length: ${iv.length}, expected 16`);
    }
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('[AES Decrypt Error]', {
      error: error instanceof Error ? error.message : String(error),
      keyLength: key.length,
      ivLength: iv.length,
      encryptedLength: encrypted.length,
      encryptedSample: encrypted.substring(0, 50)
    });
    throw error;
  }
}

// SHA256 雜湊
function sha256Hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex').toUpperCase();
}

// 建立交易資料
export function createPaymentData(params: CreatePaymentParams) {
  const { orderId, amount, itemDesc, email, returnUrl, notifyUrl, clientBackUrl } = params;
  
  const tradeInfo: TradeInfo = {
    MerchantID: ENV.newebpayMerchantId,
    RespondType: 'JSON',
    TimeStamp: Math.floor(Date.now() / 1000).toString(),
    Version: '2.0',
    MerchantOrderNo: orderId,
    Amt: amount,
    ItemDesc: itemDesc,
    Email: email,
    ReturnURL: returnUrl,
    NotifyURL: notifyUrl,
    LoginType: 0,
  };
  
  if (clientBackUrl) {
    tradeInfo.ClientBackURL = clientBackUrl;
  }
  
  // 將交易資料轉為 query string 格式
  const tradeInfoStr = Object.entries(tradeInfo)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  // AES 加密
  const tradeInfoEncrypted = aesEncrypt(tradeInfoStr, ENV.newebpayHashKey, ENV.newebpayHashIv);
  
  // SHA256 雜湊
  const tradeSha = sha256Hash(`HashKey=${ENV.newebpayHashKey}&${tradeInfoEncrypted}&HashIV=${ENV.newebpayHashIv}`);
  
  return {
    MerchantID: ENV.newebpayMerchantId,
    TradeInfo: tradeInfoEncrypted,
    TradeSha: tradeSha,
    Version: '2.0',
    PayGateWay: NEWEBPAY_API_URL,
  };
}

// 解析回傳資料（含 Result 正規化）
export function decryptPaymentResult(tradeInfo: string) {
  try {
    const decrypted = aesDecrypt(tradeInfo, ENV.newebpayHashKey, ENV.newebpayHashIv);
    console.log('[Decrypt] Decrypted string:', decrypted.substring(0, 200));

    let parsed: any;

    // 1) 先嘗試 JSON
    try {
      parsed = JSON.parse(decrypted);
    } catch {
      // 2) 再用 query string
      console.log('[Decrypt] JSON parse failed, trying query string parse');
      const params = new URLSearchParams(decrypted);
      parsed = {};
      params.forEach((value, key) => {
        parsed[key] = value;
      });
    }

    // ===== 正規化開始：處理 Result 可能是字串、或根本沒有 Result =====

    // Result 是 JSON 字串 → 轉成物件
    if (parsed && typeof parsed === 'object' && typeof parsed.Result === 'string') {
      const s = parsed.Result.trim();
      if (
        (s.startsWith('{') && s.endsWith('}')) ||
        (s.startsWith('[') && s.endsWith(']'))
      ) {
        try {
          parsed.Result = JSON.parse(s);
        } catch {
          // 解析失敗就維持原字串
        }
      }
    }

    // 沒有 Result，但有 MerchantOrderNo/Amt/TradeNo → 包一層 Result（扁平格式處理）
    if (parsed && typeof parsed === 'object' && !parsed.Result) {
      const hasTopLevel =
        parsed.MerchantOrderNo || parsed.Amt || parsed.TradeNo || parsed.PayTime || parsed.PaymentType;

      if (hasTopLevel) {
        parsed.Result = {
          MerchantOrderNo: parsed.MerchantOrderNo,
          Amt: parsed.Amt,
          TradeNo: parsed.TradeNo,
          PayTime: parsed.PayTime,
          PaymentType: parsed.PaymentType,
        };
      }
    }

    return parsed;
  } catch (error) {
    console.error('Failed to decrypt payment result:', error);
    return null;
  }
}

// 驗證回傳資料（加上 trim + toUpperCase 避免大小寫差異和前後空白）
export function verifyPaymentResult(tradeSha: string, tradeInfo: string): boolean {
  const expectedSha = sha256Hash(`HashKey=${ENV.newebpayHashKey}&${tradeInfo}&HashIV=${ENV.newebpayHashIv}`);
  return (tradeSha || '').trim().toUpperCase() === expectedSha;
}

// 驗證藍新金流設定是否正確
export function validateNewebpayConfig(): { valid: boolean; message: string } {
  if (!ENV.newebpayMerchantId) {
    return { valid: false, message: 'NEWEBPAY_MERCHANT_ID is not set' };
  }
  if (!ENV.newebpayHashKey || ENV.newebpayHashKey.length !== 32) {
    return { valid: false, message: 'NEWEBPAY_HASH_KEY must be 32 characters' };
  }
  if (!ENV.newebpayHashIv || ENV.newebpayHashIv.length !== 16) {
    return { valid: false, message: 'NEWEBPAY_HASH_IV must be 16 characters' };
  }
  return { valid: true, message: 'Newebpay configuration is valid' };
}
