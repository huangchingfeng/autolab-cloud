import { ENV } from "./env";

interface NewsletterSubscriber {
  email: string;
  name: string;
  source: "course_2026" | "event_registration" | "download_lead";
  timestamp: string;
  metadata?: {
    plan?: string;
    eventTitle?: string;
    resourceTitle?: string;
  };
}

/**
 * 發送訂閱者資料到 Make.com Webhook
 * Make.com 會接收資料並處理後續的 Substack 訂閱流程
 */
export async function sendToMakeWebhook(subscriber: NewsletterSubscriber): Promise<boolean> {
  const webhookUrl = ENV.makeWebhookUrl;
  
  if (!webhookUrl) {
    console.log("[Make Webhook] Webhook URL not configured, skipping...");
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "newsletter_subscribe",
        ...subscriber,
      }),
    });

    if (response.ok) {
      console.log(`[Make Webhook] Successfully sent subscriber: ${subscriber.email}`);
      return true;
    } else {
      console.error(`[Make Webhook] Failed to send subscriber: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error("[Make Webhook] Error sending to webhook:", error);
    return false;
  }
}

/**
 * 批次發送多個訂閱者到 Make.com Webhook
 */
export async function sendBatchToMakeWebhook(subscribers: NewsletterSubscriber[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    const result = await sendToMakeWebhook(subscriber);
    if (result) {
      success++;
    } else {
      failed++;
    }
    // 避免過快發送，每個請求間隔 100ms
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { success, failed };
}
