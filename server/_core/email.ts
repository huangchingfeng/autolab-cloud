import { Resend } from 'resend';
import { ENV } from './env';

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!ENV.resendApiKey) {
    console.warn('[Email] RESEND_API_KEY not configured, email sending disabled');
    return null;
  }
  
  if (!resend) {
    resend = new Resend(ENV.resendApiKey);
  }
  
  return resend;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email using Resend
 * Returns true if email was sent successfully, false otherwise
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const client = getResendClient();
  
  if (!client) {
    console.warn('[Email] Skipping email send - Resend not configured');
    return false;
  }

  try {
    const { data, error } = await client.emails.send({
      from: params.from || `AI峰哥 <${ENV.emailFrom}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error('[Email] Failed to send email:', error);
      return false;
    }

    console.log('[Email] Email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
}

/**
 * Generate HTML template for contact form confirmation email
 */
export function generateContactConfirmationEmail(name: string): string {
  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>感謝您的聯繫</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', 'Microsoft JhengHei', sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">感謝您的聯繫！</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                親愛的 <strong>${name}</strong>，您好：
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                感謝您透過我們的網站與我們聯繫！我們已經收到您的訊息，阿峰老師或團隊成員會仔細閱讀您的需求。
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; font-size: 18px; color: #667eea;">接下來會發生什麼？</h3>
                <ul style="margin: 0; padding-left: 20px; color: #555555;">
                  <li style="margin-bottom: 10px;">我們會仔細閱讀您的需求與問題</li>
                  <li style="margin-bottom: 10px;">通常會在 <strong>1-2 個工作天</strong>內透過電子郵件回覆您</li>
                  <li style="margin-bottom: 10px;">根據您的需求，提供客製化的 AI 培訓方案</li>
                </ul>
              </div>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                如果您有緊急需求，也歡迎直接聯繫：
              </p>
              
              <table cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #667eea;">📧 Email：</strong>
                    <a href="mailto:nikeshoxmiles@gmail.com" style="color: #667eea; text-decoration: none;">nikeshoxmiles@gmail.com</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #667eea;">📱 電話：</strong>
                    <a href="tel:0976715102" style="color: #667eea; text-decoration: none;">0976-715-102</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #667eea;">💬 LINE：</strong>
                    <span style="color: #667eea;">電話號碼搜尋 0976715102</span>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                期待與您合作！
              </p>
              
              <p style="margin: 10px 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                <strong>黃敬峰（阿峰老師）</strong><br>
                台灣企業 AI 職場實戰專家
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                © 2024 AI峰哥 | 台灣企業 AI 職場實戰專家
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                此郵件為系統自動發送，請勿直接回覆
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}


/**
 * Generate HTML template for event registration confirmation email
 */
export function generateEventConfirmationEmail(name: string, event: {
  title: string;
  subtitle?: string | null;
  eventDate: Date;
  eventTime?: string | null;
  location: string;
  locationDetails?: string | null;
  meetingUrl?: string | null;
}): string {
  const eventDateStr = new Date(event.eventDate).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>報名成功！</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', 'Microsoft JhengHei', sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🎉 報名成功！</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                親愛的 <strong>${name}</strong>，您好：
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                恭喜您成功報名以下活動！我們已經收到您的報名資訊，期待在活動中見到您！
              </p>
              
              <!-- Event Info Box -->
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; padding: 25px; margin: 30px 0; border: 1px solid #dee2e6;">
                <h2 style="margin: 0 0 15px; font-size: 20px; color: #333333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                  📌 活動資訊
                </h2>
                
                <table cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top; width: 100px;">
                      <strong style="color: #667eea;">活動名稱</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333;">
                      ${event.title}
                      ${event.subtitle ? `<br><span style="font-size: 14px; color: #666666;">${event.subtitle}</span>` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <strong style="color: #667eea;">📅 日期</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333;">
                      ${eventDateStr}
                    </td>
                  </tr>
                  ${event.eventTime ? `
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <strong style="color: #667eea;">⏰ 時間</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333;">
                      ${event.eventTime}
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <strong style="color: #667eea;">📍 地點</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333;">
                      ${event.location}
                      ${event.locationDetails ? `<br><span style="font-size: 14px; color: #666666;">${event.locationDetails}</span>` : ''}
                    </td>
                  </tr>
                  ${event.meetingUrl ? `
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <strong style="color: #667eea;">📹 會議連結</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333;">
                      <a href="${event.meetingUrl}" style="color: #667eea; text-decoration: none; font-weight: bold;">${event.meetingUrl}</a>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              ${event.meetingUrl ? `
              <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; font-size: 18px; color: #155724;">🎉 您的會議連結</h3>
                <p style="margin: 0 0 15px; color: #155724;">請於活動時間點擊以下連結加入會議：</p>
                <a href="${event.meetingUrl}" style="display: inline-block; background-color: #28a745; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">📹 加入 Google Meet 會議</a>
                <p style="margin: 15px 0 0; font-size: 14px; color: #155724;">會議連結：<a href="${event.meetingUrl}" style="color: #155724;">${event.meetingUrl}</a></p>
              </div>
              ` : ''}
              
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; font-size: 18px; color: #856404;">⚠️ 重要提醒</h3>
                <ul style="margin: 0; padding-left: 20px; color: #856404;">
                  <li style="margin-bottom: 10px;">請於活動開始前 <strong>10 分鐘</strong>進入會議室</li>
                  <li style="margin-bottom: 10px;">建議使用電腦或平板以獲得最佳觀看體驗</li>
                  <li style="margin-bottom: 10px;">如有任何問題，歡迎聯繫我們</li>
                </ul>
              </div>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                如果您有任何問題，歡迎隨時聯繫：
              </p>
              
              <table cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #667eea;">📧 Email：</strong>
                    <a href="mailto:nikeshoxmiles@gmail.com" style="color: #667eea; text-decoration: none;">nikeshoxmiles@gmail.com</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #667eea;">💬 LINE：</strong>
                    <span style="color: #667eea;">電話號碼搜尋 0976715102</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #667eea;">👥 LINE 社群：</strong>
                    <a href="https://line.me/ti/g2/o6oRaGIHTzZ1nEofxnT9Rbv7_ZHAX-rylbJfKA" style="color: #667eea; text-decoration: none;">加入 AI 學員社群</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                期待在活動中見到您！🚀
              </p>
              
              <p style="margin: 10px 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                <strong>黃敬峰（阿峰老師）</strong><br>
                台灣企業 AI 職場實戰專家
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                © 2024 AI峰哥 | 台灣企業 AI 職場實戰專家
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                此郵件為系統自動發送，請勿直接回覆
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}


/**
 * Generate HTML template for event reminder email (sent 1 day before event)
 */
export function generateEventReminderEmail(name: string, event: {
  title: string;
  subtitle?: string | null;
  eventDate: Date;
  eventTime?: string | null;
  location: string;
  meetingUrl?: string | null;
}): string {
  const eventDateStr = new Date(event.eventDate).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>活動提醒</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', 'Microsoft JhengHei', sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">⏰ 活動明天開始！</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                親愛的 <strong>${name}</strong>，您好：
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                提醒您，您報名的活動將於<strong>明天</strong>舉行！請記得準時參加，我們期待在活動中見到您！
              </p>
              
              <!-- Event Info Box -->
              <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-radius: 8px; padding: 25px; margin: 30px 0; border: 1px solid #ffcc80;">
                <h2 style="margin: 0 0 15px; font-size: 20px; color: #e65100; border-bottom: 2px solid #ff6b6b; padding-bottom: 10px;">
                  📌 活動資訊
                </h2>
                
                <table cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top; width: 100px;">
                      <strong style="color: #e65100;">活動名稱</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333;">
                      ${event.title}
                      ${event.subtitle ? `<br><span style="font-size: 14px; color: #666666;">${event.subtitle}</span>` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <strong style="color: #e65100;">📅 日期</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333;">
                      ${eventDateStr}
                    </td>
                  </tr>
                  ${event.eventTime ? `
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <strong style="color: #e65100;">⏰ 時間</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333;">
                      ${event.eventTime}
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <strong style="color: #e65100;">📍 地點</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333;">
                      ${event.location}
                    </td>
                  </tr>
                </table>
              </div>
              
              ${event.meetingUrl ? `
              <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 30px 0; border-radius: 4px; text-align: center;">
                <h3 style="margin: 0 0 15px; font-size: 18px; color: #2e7d32;">🎉 您的會議連結</h3>
                <p style="margin: 0 0 15px; color: #2e7d32;">請於活動時間點擊以下連結加入會議：</p>
                <a href="${event.meetingUrl}" style="display: inline-block; background-color: #4caf50; color: #ffffff; padding: 15px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">📹 加入 Google Meet 會議</a>
                <p style="margin: 15px 0 0; font-size: 14px; color: #2e7d32;">會議連結：<a href="${event.meetingUrl}" style="color: #2e7d32;">${event.meetingUrl}</a></p>
              </div>
              ` : ''}
              
              <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; font-size: 18px; color: #1565c0;">💡 參加提醒</h3>
                <ul style="margin: 0; padding-left: 20px; color: #1565c0;">
                  <li style="margin-bottom: 10px;">請於活動開始前 <strong>10 分鐘</strong>進入會議室</li>
                  <li style="margin-bottom: 10px;">建議使用電腦或平板以獲得最佳觀看體驗</li>
                  <li style="margin-bottom: 10px;">準備好紙筆，隨時記錄重點內容</li>
                  <li style="margin-bottom: 10px;">如有任何問題，歡迎在活動中提問</li>
                </ul>
              </div>
              
              <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                明天見！🚀
              </p>
              
              <p style="margin: 10px 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                <strong>黃敬峰（阿峰老師）</strong><br>
                台灣企業 AI 職場實戰專家
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                © 2024 AI峰哥 | 台灣企業 AI 職場實戰專家
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                此郵件為系統自動發送，請勿直接回覆
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}


/**
 * Generate HTML template for payment success confirmation email
 */
export function generatePaymentSuccessEmail(params: {
  name: string;
  orderNo: string;
  eventTitle: string;
  finalAmount: number;
  paymentMethod?: string;
  paidAt: Date;
  needInvoice?: boolean;
  taxId?: string;
  invoiceTitle?: string;
}): string {
  const paidAtStr = new Date(params.paidAt).toLocaleString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>付款成功！</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', 'Microsoft JhengHei', sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">✅ 付款成功！</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 18px; line-height: 1.6; color: #333333;">
                親愛的 <strong>${params.name}</strong>，您好！
              </p>
              
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #333333;">
                感謝您的購買！您的付款已成功完成，以下是您的訂單資訊：
              </p>
              
              <!-- Order Info -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 25px; margin: 20px 0;">
                <h2 style="margin: 0 0 20px; font-size: 20px; color: #166534;">📋 訂單資訊</h2>
                <table cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top; width: 120px;">
                      <strong style="color: #166534;">訂單編號</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333; font-family: monospace;">
                      ${params.orderNo}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <strong style="color: #166534;">課程名稱</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333;">
                      ${params.eventTitle}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <strong style="color: #166534;">付款金額</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333; font-weight: bold; font-size: 18px;">
                      NT$ ${params.finalAmount.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <strong style="color: #166534;">付款時間</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333;">
                      ${paidAtStr}
                    </td>
                  </tr>
                  ${params.paymentMethod ? `
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <strong style="color: #166534;">付款方式</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333;">
                      ${params.paymentMethod}
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              ${params.needInvoice ? `
              <!-- Invoice Info -->
              <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 25px; margin: 20px 0;">
                <h2 style="margin: 0 0 20px; font-size: 20px; color: #92400e;">🧾 發票資訊</h2>
                <table cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top; width: 120px;">
                      <strong style="color: #92400e;">統一編號</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333;">
                      ${params.taxId || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <strong style="color: #92400e;">發票抬頭</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333;">
                      ${params.invoiceTitle || '-'}
                    </td>
                  </tr>
                </table>
                <p style="margin: 15px 0 0; font-size: 14px; color: #92400e;">
                  ※ 三聯發票將於付款後 7 個工作天內寄出
                </p>
              </div>
              ` : ''}
              
              <!-- Next Steps -->
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; font-size: 18px; color: #1e40af;">📚 下一步</h3>
                <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                  <li style="margin-bottom: 10px;">請先註冊 NotebookLM 帳號，以便在課程中同步操作練習</li>
                  <li style="margin-bottom: 10px;">課程相關資訊將在活動前透過 Email 通知</li>
                  <li style="margin-bottom: 10px;">如有任何問題，歡迎隨時聯繫我們</li>
                </ul>
              </div>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                如果您有任何問題，歡迎隨時聯繫：
              </p>
              
              <table cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #10b981;">📧 Email：</strong>
                    <a href="mailto:nikeshoxmiles@gmail.com" style="color: #10b981; text-decoration: none;">nikeshoxmiles@gmail.com</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #10b981;">💬 LINE：</strong>
                    <span style="color: #10b981;">電話號碼搜尋 0976715102</span>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                感謝您的支持！期待在課程中見到您！🚀
              </p>
              
              <p style="margin: 10px 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                <strong>黃敬峰（阿峰老師）</strong><br>
                台灣企業 AI 職場實戰專家
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                © 2024 AI峰哥 | 台灣企業 AI 職場實戰專家
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                此郵件為系統自動發送，請勿直接回覆
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}


/**
 * Generate HTML template for 2026 course registration confirmation email
 */
export function generateCourse2026ConfirmationEmail(params: {
  name: string;
  plan: string;
  planPrice: number;
  selectedSessions: string[];
  paymentMethod: "transfer" | "online";
  transferLast5?: string;
}): string {
  const planNames: Record<string, string> = {
    single: "單堂體驗",
    full: "全系列套票",
    double: "雙人同行",
  };

  const sessionNames: Record<string, string> = {
    "0120": "初階 1：LLM 與 Perplexity 實戰（1/20 週一）",
    "0122": "初階 2：Deep Research 與 Gamma（1/22 週三）",
    "0124": "初階 3：NotebookLM 與 Gemini Canvas（1/24 週五）",
    "0127": "初階 4：影像生成與社群經營（1/27 週一）",
    "0203": "進階 1：AI 代理人實戰（2/3 週一）",
    "0205": "進階 2：AI 工作流設計（2/5 週三）",
    "0207": "進階 3：企業 AI 轉型案例（2/7 週五）",
    "0210": "進階 4：AI 專案管理（2/10 週一）",
    "0303": "高階 1：AI 策略規劃（3/3 週一）",
    "0305": "高階 2：AI 團隊建設（3/5 週三）",
    "0307": "高階 3：AI 投資報酬率分析（3/7 週五）",
    "0310": "高階 4：AI 未來趨勢（3/10 週一）",
  };

  const selectedSessionsList = params.selectedSessions
    .map((id) => `<li style="margin-bottom: 10px;">${sessionNames[id] || id}</li>`)
    .join("");

  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>報名成功！</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', 'Microsoft JhengHei', sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #e65100 0%, #ff6f00 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🎉 報名成功！</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 18px; line-height: 1.6; color: #333333;">
                親愛的 <strong>${params.name}</strong>，您好！
              </p>
              
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #333333;">
                感謝您報名 <strong>2026 AI 實戰應用課</strong>！以下是您的報名資訊：
              </p>
              
              <!-- Registration Info -->
              <div style="background-color: #fff3e0; border: 1px solid #ffb74d; border-radius: 8px; padding: 25px; margin: 20px 0;">
                <h2 style="margin: 0 0 20px; font-size: 20px; color: #e65100;">📋 報名資訊</h2>
                <table cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top; width: 120px;">
                      <strong style="color: #e65100;">方案</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333;">
                      ${planNames[params.plan] || params.plan}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <strong style="color: #e65100;">費用</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333; font-weight: bold; font-size: 18px;">
                      NT$ ${params.planPrice.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; vertical-align: top;">
                      <strong style="color: #e65100;">付款方式</strong>
                    </td>
                    <td style="padding: 10px 0; color: #333333;">
                      ${params.paymentMethod === "transfer" ? "銀行匯款" : "線上刷卡"}
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Selected Sessions -->
              <div style="background-color: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 25px; margin: 20px 0;">
                <h2 style="margin: 0 0 20px; font-size: 20px; color: #1565c0;">📅 您選擇的課程</h2>
                <ul style="margin: 0; padding-left: 20px; color: #1565c0;">
                  ${selectedSessionsList}
                </ul>
              </div>
              
              ${params.paymentMethod === "transfer" ? `
              <!-- Transfer Instructions -->
              <div style="background-color: #fff9c4; border-left: 4px solid #fbc02d; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; font-size: 18px; color: #f57f17;">💰 匯款資訊</h3>
                <p style="margin: 0 0 15px; color: #f57f17;">
                  請於 <strong>3 天內</strong>完成匯款，並填寫您的帳號後五碼：<strong>${params.transferLast5}</strong>
                </p>
                <table cellpadding="0" cellspacing="0" style="margin: 15px 0; background-color: #ffffff; padding: 15px; border-radius: 4px;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>銀行：</strong></td>
                    <td style="padding: 5px 0;">台新銀行（812）</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>分行：</strong></td>
                    <td style="padding: 5px 0;">三和分行（0698）</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>戶名：</strong></td>
                    <td style="padding: 5px 0;">交點文化股份有限公司</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>帳號：</strong></td>
                    <td style="padding: 5px 0;">20690100002452</td>
                  </tr>
                </table>
                <p style="margin: 15px 0 0; font-size: 14px; color: #f57f17;">
                  ※ 匯款完成後，我們將於 1-2 個工作天內確認您的付款
                </p>
              </div>
              ` : `
              <!-- Online Payment Success -->
              <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; font-size: 18px; color: #2e7d32;">✅ 付款成功</h3>
                <p style="margin: 0; color: #2e7d32;">
                  您的線上付款已成功完成，課程相關資訊將在活動前透過 Email 通知。
                </p>
              </div>
              `}
              
              <!-- Next Steps -->
              <div style="background-color: #f3e5f5; border-left: 4px solid #9c27b0; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; font-size: 18px; color: #6a1b9a;">📚 接下來</h3>
                <ul style="margin: 0; padding-left: 20px; color: #6a1b9a;">
                  <li style="margin-bottom: 10px;">課程前 3 天會發送提醒通知</li>
                  <li style="margin-bottom: 10px;">課程連結將在開課前 1 天提供</li>
                  <li style="margin-bottom: 10px;">建議提前準備好筆記本和電腦</li>
                  <li style="margin-bottom: 10px;">如有任何問題，歡迎隨時聯繫我們</li>
                </ul>
              </div>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                如果您有任何問題，歡迎隨時聯繫：
              </p>
              
              <table cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #e65100;">📧 Email：</strong>
                    <a href="mailto:nikeshoxmiles@gmail.com" style="color: #e65100; text-decoration: none;">nikeshoxmiles@gmail.com</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #e65100;">💬 LINE：</strong>
                    <span style="color: #e65100;">電話號碼搜尋 0976715102</span>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                期待在課程中見到您！🚀
              </p>
              
              <p style="margin: 10px 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                <strong>黃敬峰（阿峰老師）</strong><br>
                台灣企業 AI 職場實戰專家
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                © 2026 AI峰哥 | 台灣企業 AI 職場實戰專家
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                此郵件為系統自動發送，請勿直接回覆
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}


/**
 * Generate course transfer notification email
 */
export function generateCourseTransferEmail(params: {
  name: string;
  fromSessionName: string;
  fromSessionDate: string;
  fromSessionTime: string;
  toSessionName: string;
  toSessionDate: string;
  toSessionTime: string;
  location: string;
  reason?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>課程調課通知</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 0;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-weight: 600;">
                📅 課程調課通知
              </h1>
              <p style="margin: 15px 0 0; font-size: 16px; color: #bbdefb;">
                您的課程時間已更新
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 25px; font-size: 18px; line-height: 1.6; color: #333333;">
                親愛的 <strong style="color: #1976d2;">${params.name}</strong> 您好，
              </p>
              
              <p style="margin: 0 0 25px; font-size: 16px; line-height: 1.6; color: #333333;">
                您的課程已成功調整，以下是調課詳情：
              </p>
              
              <!-- Transfer Details -->
              <div style="background-color: #fff3e0; border: 1px solid #ffcc80; border-radius: 8px; padding: 25px; margin: 20px 0;">
                <h2 style="margin: 0 0 20px; font-size: 18px; color: #e65100;">🔄 調課詳情</h2>
                
                <!-- From Session -->
                <div style="background-color: #ffebee; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
                  <p style="margin: 0 0 5px; font-size: 14px; color: #c62828; font-weight: 600;">原課程</p>
                  <p style="margin: 0; font-size: 16px; color: #333333;">
                    <strong>${params.fromSessionName}</strong><br>
                    <span style="color: #666666;">${params.fromSessionDate} ${params.fromSessionTime}</span>
                  </p>
                </div>
                
                <!-- Arrow -->
                <div style="text-align: center; margin: 10px 0;">
                  <span style="font-size: 24px;">⬇️</span>
                </div>
                
                <!-- To Session -->
                <div style="background-color: #e8f5e9; border-radius: 6px; padding: 15px;">
                  <p style="margin: 0 0 5px; font-size: 14px; color: #2e7d32; font-weight: 600;">新課程</p>
                  <p style="margin: 0; font-size: 16px; color: #333333;">
                    <strong>${params.toSessionName}</strong><br>
                    <span style="color: #666666;">${params.toSessionDate} ${params.toSessionTime}</span>
                  </p>
                </div>
              </div>
              
              <!-- Location Info -->
              <div style="background-color: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 25px; margin: 20px 0;">
                <h2 style="margin: 0 0 15px; font-size: 18px; color: #1565c0;">📍 上課地點</h2>
                <p style="margin: 0; font-size: 16px; color: #333333;">
                  <strong>${params.location}</strong>
                </p>
                <p style="margin: 10px 0 0; font-size: 14px; color: #666666;">
                  詳細地址將於課程前一天以 Email 通知
                </p>
              </div>
              
              ${params.reason ? `
              <!-- Reason -->
              <div style="background-color: #f5f5f5; border-left: 4px solid #9e9e9e; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #666666;">
                  <strong>調課原因：</strong>${params.reason}
                </p>
              </div>
              ` : ''}
              
              <!-- Important Notice -->
              <div style="background-color: #fff9c4; border-left: 4px solid #fbc02d; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; font-size: 16px; color: #f57f17;">⚠️ 注意事項</h3>
                <ul style="margin: 0; padding-left: 20px; color: #f57f17; font-size: 14px;">
                  <li style="margin-bottom: 8px;">請確認新的上課時間，並提前安排行程</li>
                  <li style="margin-bottom: 8px;">如有任何問題，請聯繫我們</li>
                  <li>課程相關資訊將於活動前透過 Email 通知</li>
                </ul>
              </div>
              
              <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                期待在新的課程時間見到您！🚀
              </p>
              
              <p style="margin: 10px 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                <strong>黃敬峰（阿峰老師）</strong><br>
                台灣企業 AI 職場實戰專家
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                © 2026 AI峰哥 | 台灣企業 AI 職場實戰專家
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                此郵件為系統自動發送，請勿直接回覆
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
