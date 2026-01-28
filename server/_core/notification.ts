/**
 * 通知服務
 * 使用 Email 通知管理員
 */

import { TRPCError } from "@trpc/server";
import { sendEmail } from "./email";
import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content };
};

/**
 * 通知管理員（透過 Email）
 * 會發送 Email 到設定的管理員信箱
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  // 如果沒有設定 Resend API Key，跳過通知
  if (!ENV.resendApiKey) {
    console.warn("[Notification] Resend API key not configured, skipping notification");
    return false;
  }

  try {
    // 發送 Email 通知
    await sendEmail({
      to: ENV.emailFrom, // 發送給自己作為通知
      subject: `[網站通知] ${title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">${title}</h2>
          <div style="white-space: pre-wrap; line-height: 1.6;">
            ${content}
          </div>
          <hr style="margin: 2rem 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #666; font-size: 0.9rem;">
            此通知來自 autolab.cloud 網站系統
          </p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.warn("[Notification] Error sending notification email:", error);
    return false;
  }
}

/**
 * 發送自定義通知 Email
 */
export async function sendNotificationEmail(
  to: string,
  subject: string,
  content: string
): Promise<boolean> {
  if (!ENV.resendApiKey) {
    console.warn("[Notification] Resend API key not configured");
    return false;
  }

  try {
    await sendEmail({
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="white-space: pre-wrap; line-height: 1.6;">
            ${content}
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("[Notification] Failed to send email:", error);
    return false;
  }
}
