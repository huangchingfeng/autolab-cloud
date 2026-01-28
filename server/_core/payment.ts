import type { Express, Request, Response } from "express";
import express from "express";
import qs from "qs";
import { decryptPaymentResult, verifyPaymentResult } from "./newebpay";
import * as db from "../db";
import { sendEmail, generatePaymentSuccessEmail } from "./email";

export function registerPaymentRoutes(app: Express) {
  // 藍新金流付款完成後的背景通知（Notify URL）
  // 使用 express.text() 收 raw body，避免 body parser 解析失敗造成 400
  // ✅ 修改：改成「先處理再 ACK」，Email 放 ACK 後
  app.post("/api/payment/notify", express.text({ type: "*/*" }), async (req: Request, res: Response) => {
    console.log("[Payment Notify] ===== START =====");
    console.log("[Payment Notify] Content-Type:", req.get("content-type"));
    console.log("[Payment Notify] Raw body length:", (req.body as string)?.length);
    console.log("[Payment Notify] Raw body sample:", (req.body as string)?.substring(0, 200));

    // 1) 解析 body
    const parsed = qs.parse(req.body as string);
    const TradeInfo = parsed.TradeInfo as string;
    const TradeSha = parsed.TradeSha as string;

    if (!TradeInfo || !TradeSha) {
      console.error("[Payment Notify] ❌ Missing TradeInfo/TradeSha");
      // ✅ 永久性錯誤：回 200 避免洗重送（重送也不會變好），但要記錄/告警
      res.status(200).send("OK");
      return;
    }

    // 2) 驗簽（失敗就不 ACK，讓藍新判斷未成功送達；但通常這是永久性錯誤）
    const crypto = await import("crypto");
    const { ENV } = await import("./env");
    const expectedSha = crypto
      .createHash("sha256")
      .update(`HashKey=${ENV.newebpayHashKey}&${TradeInfo}&HashIV=${ENV.newebpayHashIv}`)
      .digest("hex")
      .toUpperCase();

    const normalizedMatch = (TradeSha || "").trim().toUpperCase() === expectedSha;
    console.log("[Payment Notify] TradeSha received:", TradeSha);
    console.log("[Payment Notify] Expected TradeSha:", expectedSha);
    console.log("[Payment Notify] TradeSha match(normalized):", normalizedMatch);

    if (!verifyPaymentResult(TradeSha, TradeInfo)) {
      console.error("[Payment Notify] ❌ Invalid signature");
      console.error("[Payment Notify] Received:", TradeSha);
      console.error("[Payment Notify] Expected:", expectedSha);
      // ✅ 驗簽失敗回 200（重送也不會變好），但要記錄
      res.status(200).send("OK");
      return;
    }

    console.log("[Payment Notify] ✅ Signature verified");

    // 3) 解密 + 正規化欄位
    const result = decryptPaymentResult(TradeInfo);
    if (!result) {
      console.error("[Payment Notify] ❌ Decrypt failed");
      res.status(200).send("OK"); // 永久性異常，回 200 避免重送
      return;
    }

    console.log("[Payment Notify] Decrypted result:", JSON.stringify(result, null, 2));

    const status = String((result as any)?.Status || "").toUpperCase();
    const message = (result as any)?.Message;
    const resultObj: any = (result as any)?.Result || {};

    // ✅ 兼容各種回傳格式（扁平、Result JSON 字串、Result 物件）
    const merchantOrderNo: string | undefined =
      resultObj?.MerchantOrderNo ?? (result as any)?.MerchantOrderNo;
    const amtRaw: any = resultObj?.Amt ?? (result as any)?.Amt;
    const tradeNo: string | undefined = resultObj?.TradeNo ?? (result as any)?.TradeNo;
    const paymentType: string | undefined = resultObj?.PaymentType ?? (result as any)?.PaymentType;

    console.log("[Payment Notify] Status:", status);
    console.log("[Payment Notify] MerchantOrderNo:", merchantOrderNo);
    console.log("[Payment Notify] Amt:", amtRaw);
    console.log("[Payment Notify] TradeNo:", tradeNo);

    // ✅ MerchantOrderNo 缺值保護
    if (!merchantOrderNo) {
      console.error("[Payment Notify] ❌ Missing MerchantOrderNo after decrypt");
      res.status(200).send("OK"); // 永久性異常，回 200 避免重送
      return;
    }

    // Email 改成 ACK 後送，避免金流 callback timeout
    let emailTask: null | (() => Promise<void>) = null;

    // 4) DB 更新（重要：在 ACK 前做；若 DB 壞掉就回 500 讓藍新重送）
    try {
      if (status === "SUCCESS") {
        if (merchantOrderNo.startsWith("C26_") || merchantOrderNo.startsWith("COURSE2026_")) {
          const registrationId = parseInt(merchantOrderNo.split("_")[1]);
          if (!Number.isFinite(registrationId)) {
            console.error(`[Payment Notify] ❌ Invalid COURSE2026 registrationId: ${merchantOrderNo}`);
            // 永久性異常：回 200 避免一直重送
            res.status(200).send("OK");
            return;
          }

          const registration = await db.getCourseRegistration2026ById(registrationId);
          if (!registration) {
            console.error(`[Payment Notify] ❌ Registration not found: ${registrationId}`);
            // 永久性異常：回 200 避免一直重送
            res.status(200).send("OK");
            return;
          }

          const expectedAmount = registration.planPrice;
          const actualAmount = Number(amtRaw);
          if (!Number.isFinite(actualAmount)) {
            console.error(`[Payment Notify] ❌ Amt is not a number: ${String(amtRaw)}`);
            res.status(200).send("OK");
            return;
          }
          if (Math.abs(expectedAmount - actualAmount) > 1) {
            console.error(`[Payment Notify] ❌ Amount mismatch: expected ${expectedAmount}, got ${actualAmount}`);
            res.status(200).send("OK");
            return;
          }

          console.log(`[Payment Notify] ✅ Amount validated: ${actualAmount} NTD`);

          const updateResult = await db.updateCourseRegistration2026PaymentStatus(
            registrationId,
            "paid",
            tradeNo
          );

          if (!updateResult.alreadyPaid) {
            console.log(`[Payment Notify] ✅ Course2026 registration ${registrationId} paid successfully`);
            emailTask = async () => {
              const { generateCourse2026ConfirmationEmail } = await import("./email");
              const emailHtml = generateCourse2026ConfirmationEmail({
                name: registration.name1,
                plan: registration.plan,
                planPrice: registration.planPrice,
                selectedSessions: JSON.parse(registration.selectedSessions),
                paymentMethod: "online",
              });

              await sendEmail({
                to: registration.email1,
                subject: `✅ 付款成功！2026 AI 實戰應用課`,
                html: emailHtml,
              });
              console.log(`[Payment Notify] ✅ Confirmation email sent to ${registration.email1}`);

              // Send to Make.com Webhook if subscribed to newsletter
              if (registration.subscribeNewsletter) {
                const { sendToMakeWebhook } = await import("./makeWebhook");
                await sendToMakeWebhook({
                  email: registration.email1,
                  name: registration.name1,
                  source: "course_2026",
                  timestamp: new Date().toISOString(),
                  metadata: {
                    plan: registration.plan,
                  },
                });
                // Also send second person if double plan
                if (registration.plan === "double" && registration.email2 && registration.name2) {
                  await sendToMakeWebhook({
                    email: registration.email2,
                    name: registration.name2,
                    source: "course_2026",
                    timestamp: new Date().toISOString(),
                    metadata: {
                      plan: registration.plan,
                    },
                  });
                }
                console.log(`[Payment Notify] ✅ Newsletter subscription sent to Make.com`);
              }

              // Send to accounting system
              try {
                const { sendPaymentSuccess } = await import("./accountingWebhook");
                await sendPaymentSuccess({
                  userType: registration.userType,
                  plan: registration.plan as 'single' | 'full' | 'double',
                  planPrice: registration.planPrice,
                  selectedSessions: registration.selectedSessions,
                  selectedMonth: registration.selectedMonth ?? undefined,
                  name1: registration.name1,
                  phone1: registration.phone1,
                  email1: registration.email1,
                  industry1: registration.industry1 ?? undefined,
                  name2: registration.name2 ?? undefined,
                  phone2: registration.phone2 ?? undefined,
                  email2: registration.email2 ?? undefined,
                  industry2: registration.industry2 ?? undefined,
                  paymentMethod: registration.paymentMethod,
                  transferLast5: registration.transferLast5 ?? undefined,
                  promoCode: registration.promoCode ?? undefined,
                  paymentStatus: "paid",
                });
                console.log(`[Payment Notify] ✅ Accounting webhook sent`);
              } catch (webhookError) {
                console.error('[Payment Notify] Failed to send accounting webhook:', webhookError);
              }
            };
          } else {
            console.log(`[Payment Notify] ⚠️ Course2026 registration ${registrationId} was already paid, skipping email`);
          }
        } else {
          const orderResult = await db.getOrderByOrderNo(merchantOrderNo);
          if (!orderResult || !orderResult.order) {
            console.error(`[Payment Notify] ❌ Order not found: ${merchantOrderNo}`);
            res.status(200).send("OK");
            return;
          }

          const order = orderResult.order;

          const expectedAmount = order.finalAmount;
          const actualAmount = Number(amtRaw);
          if (!Number.isFinite(actualAmount)) {
            console.error(`[Payment Notify] ❌ Amt is not a number: ${String(amtRaw)}`);
            res.status(200).send("OK");
            return;
          }
          if (Math.abs(expectedAmount - actualAmount) > 1) {
            console.error(`[Payment Notify] ❌ Amount mismatch: expected ${expectedAmount}, got ${actualAmount}`);
            res.status(200).send("OK");
            return;
          }

          console.log(`[Payment Notify] ✅ Amount validated: ${actualAmount} NTD`);

          const updateResult = await db.updateOrderPaymentStatus(merchantOrderNo, "paid", {
            newebpayTradeNo: tradeNo,
            paidAt: new Date(),
          });

          if (!updateResult.alreadyPaid) {
            console.log(`[Payment Notify] ✅ Order ${merchantOrderNo} paid successfully`);
            emailTask = async () => {
              const event = orderResult.event;
              const emailHtml = generatePaymentSuccessEmail({
                name: order.name,
                orderNo: order.orderNo,
                eventTitle: event?.title || "課程",
                finalAmount: order.finalAmount,
                paymentMethod: paymentType || "信用卡",
                paidAt: new Date(),
                needInvoice: order.needInvoice || false,
                taxId: order.taxId || undefined,
                invoiceTitle: order.invoiceTitle || undefined,
              });

              await sendEmail({
                to: order.email,
                subject: `✅ 付款成功！您已成功購買「${event?.title || "課程"}」`,
                html: emailHtml,
              });
              console.log(`[Payment Notify] ✅ Confirmation email sent to ${order.email}`);
            };
          } else {
            console.log(`[Payment Notify] ⚠️ Order ${merchantOrderNo} was already paid, skipping email`);
          }
        }
      } else {
        // 非 SUCCESS 一樣要落 DB（但仍要冪等）
        if (merchantOrderNo.startsWith("C26_") || merchantOrderNo.startsWith("COURSE2026_")) {
          const registrationId = parseInt(merchantOrderNo.split("_")[1]);
          if (Number.isFinite(registrationId)) {
            await db.updateCourseRegistration2026PaymentStatus(registrationId, "failed");
          }
        } else {
          await db.updateOrderPaymentStatus(merchantOrderNo, "failed");
        }
        console.log(`[Payment Notify] ❌ Payment failed: ${message}`);
      }
    } catch (err) {
      // ✅ 關鍵：DB / 系統暫時性錯誤 -> 回 500 讓藍新重送
      console.error("[Payment Notify] ❌ Processing error (return 500 for retry):", err);
      res.status(500).send("Server error");
      return;
    }

    // 5) DB 已成功處理 -> 才 ACK 200
    res.status(200).send("OK");
    console.log("[Payment Notify] ✅ ACK sent (HTTP 200)");
    console.log("[Payment Notify] ===== END (ACK) =====");

    // 6) Email 在 ACK 後送（不影響金流 callback）
    if (emailTask) {
      void (async () => {
        try {
          await emailTask();
        } catch (emailError) {
          console.error("[Payment Notify] ❌ Email send failed:", emailError);
        }
      })();
    }
  });

  // 藍新金流付款完成後的前端跳轉（Return URL）
  // 使用 /api/ 前綴避免被前端 SPA 路由攔截
  // 同樣使用 express.text() 收 raw body
  app.post("/api/payment/return", express.text({ type: "*/*" }), async (req: Request, res: Response) => {
    console.log("[Payment Return] ===== START =====");
    console.log("[Payment Return] Content-Type:", req.get("content-type"));
    console.log("[Payment Return] Raw body length:", (req.body as string)?.length);
    console.log("[Payment Return] Raw body sample:", (req.body as string)?.substring(0, 200));

    // 使用 qs.parse() 手動解析 body
    const parsed = qs.parse(req.body as string);
    console.log("[Payment Return] Parsed keys:", Object.keys(parsed));

    try {
      // 從手動解析的結果取得 TradeInfo 和 TradeSha
      const TradeInfo = parsed.TradeInfo as string;
      const TradeSha = parsed.TradeSha as string;

      console.log("[Payment Return] TradeInfo length:", TradeInfo?.length);
      console.log("[Payment Return] TradeInfo sample:", TradeInfo?.substring(0, 100));
      console.log("[Payment Return] TradeSha:", TradeSha);

      if (!TradeInfo || !TradeSha) {
        console.error("[Payment Return] ❌ Missing TradeInfo or TradeSha");
        console.log("[Payment Return] ===== END (Missing fields) =====");
        res.redirect("/payment-result?payment=failed&error=missing_data");
        return;
      }

      // 驗證簽章
      console.log("[Payment Return] Verifying signature...");
      const crypto = await import("crypto");
      const { ENV } = await import("./env");
      const expectedSha = crypto
        .createHash("sha256")
        .update(`HashKey=${ENV.newebpayHashKey}&${TradeInfo}&HashIV=${ENV.newebpayHashIv}`)
        .digest("hex")
        .toUpperCase();

      const normalizedMatch = (TradeSha || "").trim().toUpperCase() === expectedSha;
      console.log("[Payment Return] TradeSha received:", TradeSha);
      console.log("[Payment Return] Expected TradeSha:", expectedSha);
      console.log("[Payment Return] TradeSha match(normalized):", normalizedMatch);

      if (!verifyPaymentResult(TradeSha, TradeInfo)) {
        console.error("[Payment Return] ❌ Invalid signature");
        console.error("[Payment Return] Received:", TradeSha);
        console.error("[Payment Return] Expected:", expectedSha);
        console.log("[Payment Return] ===== END (Invalid signature) =====");
        res.redirect("/payment-result?payment=failed&error=invalid_signature");
        return;
      }

      console.log("[Payment Return] ✅ Signature verified");

      // 解密交易資料
      console.log("[Payment Return] Decrypting TradeInfo...");
      const result = decryptPaymentResult(TradeInfo);
      console.log("[Payment Return] Decrypted result:", JSON.stringify(result, null, 2));

      if (!result) {
        console.error("[Payment Return] ❌ Failed to decrypt TradeInfo");
        console.log("[Payment Return] ===== END (Decrypt failed) =====");
        res.redirect("/payment-result?payment=failed&error=decrypt_failed");
        return;
      }

      console.log("[Payment Return] ✅ Decryption successful");

      const status = String((result as any)?.Status || "").toUpperCase();
      const resultObj: any = (result as any)?.Result || {};

      // ✅ 兼容各種回傳格式（扁平、Result JSON 字串、Result 物件）
      const merchantOrderNo: string | undefined =
        resultObj?.MerchantOrderNo ?? (result as any)?.MerchantOrderNo;

      console.log("[Payment Return] Status:", status);
      console.log("[Payment Return] MerchantOrderNo:", merchantOrderNo);

      // ✅ MerchantOrderNo 缺值保護
      if (!merchantOrderNo) {
        console.error("[Payment Return] ❌ Missing MerchantOrderNo after decrypt");
        console.log("[Payment Return] ===== END (Missing MerchantOrderNo) =====");
        res.redirect("/payment-result?payment=failed&error=missing_order_no");
        return;
      }

      if (status === "SUCCESS") {
        console.log("[Payment Return] ✅ Payment successful, redirecting to success page");
        console.log("[Payment Return] ===== END (Success) =====");

        // 判斷訂單類型，導向不同的結果頁面
        if (merchantOrderNo.startsWith("C26_") || merchantOrderNo.startsWith("COURSE2026_")) {
          // 2026 課程報名，導向專屬結果頁面
          const registrationId = merchantOrderNo.split("_")[1];
          res.redirect(`/course-2026-payment-result?payment=success&id=${registrationId}`);
        } else {
          // 一般活動報名
          res.redirect(`/payment-result?payment=success&order=${merchantOrderNo}`);
        }
      } else {
        console.log("[Payment Return] ❌ Payment failed, redirecting to failed page");
        console.log("[Payment Return] ===== END (Failed) =====");

        // 判斷訂單類型，導向不同的結果頁面
        if (merchantOrderNo.startsWith("C26_") || merchantOrderNo.startsWith("COURSE2026_")) {
          const registrationId = merchantOrderNo.split("_")[1];
          res.redirect(`/course-2026-payment-result?payment=failed&id=${registrationId}`);
        } else {
          res.redirect(`/payment-result?payment=failed&order=${merchantOrderNo}`);
        }
      }
    } catch (error) {
      console.error("[Payment Return] ❌ Exception:", error);
      console.log("[Payment Return] ===== END (Exception) =====");
      res.redirect("/payment-result?payment=failed&error=unknown");
    }
  });
}
