import type { Event } from "../../drizzle/schema";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

export function generateBNIEventConfirmationEmail(name: string, event: Event): string {
  const eventDate = format(new Date(event.eventDate), "yyyy年MM月dd日 (E)", { locale: zhTW });
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.locationDetails || event.location)}`;

  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>報名確認 - ${event.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Microsoft JhengHei', '微軟正黑體', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                報名成功！
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                感謝您報名參加 BNI AI 實戰交流會
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="margin: 0; font-size: 16px; color: #333333; line-height: 1.6;">
                親愛的 <strong>${name}</strong> 夥伴，您好：
              </p>
              <p style="margin: 15px 0 0 0; font-size: 16px; color: #333333; line-height: 1.6;">
                您已成功報名「<strong>${event.title}</strong>」，我們期待與您在活動中見面！
              </p>
            </td>
          </tr>

          <!-- Event Details -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                      📅 活動資訊
                    </h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td width="100" style="font-weight: bold; color: #475569; vertical-align: top;">活動名稱</td>
                        <td style="color: #1e293b;">${event.title}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: bold; color: #475569; vertical-align: top;">活動日期</td>
                        <td style="color: #1e293b;">${eventDate}</td>
                      </tr>
                      ${event.eventTime ? `
                      <tr>
                        <td style="font-weight: bold; color: #475569; vertical-align: top;">活動時間</td>
                        <td style="color: #1e293b;">${event.eventTime}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="font-weight: bold; color: #475569; vertical-align: top;">活動地點</td>
                        <td style="color: #1e293b;">
                          ${event.locationDetails || event.location}
                          <br>
                          <a href="${mapUrl}" style="color: #2563eb; text-decoration: none; font-size: 14px; margin-top: 5px; display: inline-block;">
                            📍 在 Google Maps 中查看
                          </a>
                        </td>
                      </tr>
                      ${event.price > 0 ? `
                      <tr>
                        <td style="font-weight: bold; color: #475569; vertical-align: top;">場地費用</td>
                        <td style="color: #1e293b;">場地費均攤 NT$ ${event.price.toLocaleString()}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pre-event Notes -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 20px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #92400e;">
                      ⚠️ 課前注意事項
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #78350f; line-height: 1.8;">
                      <li>請攜帶筆記型電腦，課程將進行實機操作</li>
                      <li>建議事先註冊 Google 帳號（用於 Gemini 與 NotebookLM）</li>
                      <li>如需停車，請提前規劃停車位置</li>
                      <li>場地費用將於活動現場收取</li>
                      <li>如有任何問題，歡迎隨時與我們聯繫</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BNI Spirit -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px; padding: 20px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #065f46;">
                      💡 BNI 精神提醒
                    </h3>
                    <p style="margin: 0; color: #047857; line-height: 1.8;">
                      在 BNI 強調「付出者收穫」的環境中，透過本次課程學習 AI 工具，將能提升您的服務效率，讓您更有餘裕協助夥伴。期待您將所學應用在業務簡報（Feature Presentation）中，讓夥伴更清楚如何引薦給您！
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact Info -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                如有任何疑問，歡迎透過以下方式聯繫我們：<br>
                📧 Email: nikeshoxmiles@gmail.com<br>
                📱 LINE: 0976715102<br>
                ☎️ 電話: 0976-715-102
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">
                期待在活動中與您相見！<br>
                <strong style="color: #1e293b;">AI峰哥 / 阿峰老師</strong>
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
