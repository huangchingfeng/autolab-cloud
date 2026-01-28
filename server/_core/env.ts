import "dotenv/config";

export const ENV = {
  // 基本設定
  isProduction: process.env.NODE_ENV === "production",
  appUrl: process.env.VITE_APP_URL ?? "http://localhost:5173",

  // JWT / Cookie
  cookieSecret: process.env.JWT_SECRET ?? "",

  // 資料庫 (PlanetScale)
  databaseUrl: process.env.DATABASE_URL ?? "",

  // 認證 (Clerk)
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? "",

  // 管理員 User IDs (逗號分隔)
  adminUserIds: (process.env.ADMIN_USER_IDS ?? "").split(",").filter(Boolean),

  // 檔案儲存 (Cloudflare R2)
  r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2BucketName: process.env.R2_BUCKET_NAME ?? "autolab-assets",
  r2PublicUrl: process.env.R2_PUBLIC_URL ?? "",

  // Email (Resend)
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "noreply@autolab.cloud",

  // 藍新金流
  newebpayMerchantId: process.env.NEWEBPAY_MERCHANT_ID ?? "",
  newebpayHashKey: process.env.NEWEBPAY_HASH_KEY ?? "",
  newebpayHashIv: process.env.NEWEBPAY_HASH_IV ?? "",
  newebpayApiUrl: process.env.NEWEBPAY_API_URL ?? "https://ccore.newebpay.com/MPG/mpg_gateway",

  // Cloudflare Turnstile
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY ?? "",

  // Gemini API
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",

  // Make.com Webhook for newsletter subscription
  makeWebhookUrl: process.env.MAKE_WEBHOOK_URL ?? "",

  // Accounting System Webhook
  accountingWebhookUrl: process.env.ACCOUNTING_WEBHOOK_URL ?? "",
  accountingWebhookEnabled: process.env.ACCOUNTING_WEBHOOK_ENABLED === "true",
};

// 驗證必要的環境變數
export function validateEnv() {
  const required = [
    "DATABASE_URL",
    "CLERK_SECRET_KEY",
    "JWT_SECRET",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    if (ENV.isProduction) {
      process.exit(1);
    }
  }
}
