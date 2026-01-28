/**
 * 網站後端 Webhook 發送器
 * 檔案路徑：server/_core/accountingWebhook.ts
 *
 * 環境變數設定（加入 .env）：
 * ACCOUNTING_WEBHOOK_URL=https://script.google.com/macros/s/你的部署ID/exec
 * ACCOUNTING_WEBHOOK_ENABLED=true
 */

// ============================================
// 課程場次對照表（根據文件第 138-145 行）
// ============================================
const SESSION_MAP: Record<string, { name: string; date: string }> = {
  '0122_3': { name: '第三堂：AI 簡報設計', date: '1/22（三）' },
  '0122_4': { name: '第四堂：AI 業務飛輪', date: '1/22（三）' },
  '0127_1': { name: '第一堂：AI 基礎入門', date: '1/27（一）' },
  '0127_2': { name: '第二堂：AI 文案寫作', date: '1/27（一）' },
  '0128_3': { name: '第三堂：AI 簡報設計', date: '1/28（二）' },
  '0128_4': { name: '第四堂：AI 業務飛輪', date: '1/28（二）' },
};

// 方案對照表（根據文件第 129-132 行）
const PLAN_NAMES: Record<string, string> = {
  'single': '單堂課程',
  'full': '四堂全報',
  'double': '雙人同行',
};

// ============================================
// 資料型別定義
// ============================================
interface EventRegistration {
  id?: number;
  eventId: number;
  eventTitle: string;  // 從 events.title 取得
  name: string;
  email: string;
  phone: string;
  attendeeCount?: number;
  company?: string;
  jobTitle?: string;
  referralSource?: string;
  bniChapter?: string;
  status?: string;
}

interface CourseRegistration {
  id?: number;
  userType: 'new' | 'returning';
  plan: 'single' | 'full' | 'double';
  planPrice: number;
  selectedSessions: string;  // JSON 字串，如 "[\"0127_1\",\"0127_2\"]"
  selectedMonth?: string;
  name1: string;
  phone1: string;
  email1: string;
  industry1?: string;
  name2?: string;
  phone2?: string;
  email2?: string;
  industry2?: string;
  paymentMethod: 'transfer' | 'online';
  transferLast5?: string;
  promoCode?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  status?: string;
}

type RegistrationType = 'event' | 'course';

// ============================================
// 主要函數
// ============================================

/**
 * 發送活動報名資料到會計系統
 */
export async function sendEventRegistration(
  registration: EventRegistration
): Promise<{ success: boolean; error?: string }> {
  return sendWebhook({
    type: 'event',
    timestamp: new Date().toISOString(),
    source: 'ai-feng-website',
    data: {
      name: String(registration.name || ''),
      email: String(registration.email || ''),
      phone: String(registration.phone || ''),
      company: String(registration.company || ''),
      participants: registration.attendeeCount || 1,
      course_name: String(registration.eventTitle || ''),  // 使用活動標題作為課程名稱
      notes: [
        registration.jobTitle ? `職稱：${registration.jobTitle}` : '',
        registration.bniChapter ? `BNI：${registration.bniChapter}` : '',
        registration.referralSource ? `來源：${registration.referralSource}` : '',
      ].filter(Boolean).join('；'),
      status: String(registration.status || 'registered'),
    }
  });
}

/**
 * 發送課程報名資料到會計系統
 */
export async function sendCourseRegistration(
  registration: CourseRegistration
): Promise<{ success: boolean; error?: string }> {
  // 解析 selectedSessions
  const sessions = parseSelectedSessions(registration.selectedSessions);
  const courseName = generateCourseName(registration.plan, sessions);

  return sendWebhook({
    type: 'course',
    timestamp: new Date().toISOString(),
    source: 'ai-feng-website',
    data: {
      // 主要報名者
      name: String(registration.name1 || ''),
      email: String(registration.email1 || ''),
      phone: String(registration.phone1 || ''),
      company: String(registration.industry1 || ''),
      participants: registration.name2 ? 2 : 1,
      // 課程資訊
      course_name: String(courseName || ''),
      notes: [
        `方案：${PLAN_NAMES[registration.plan] || registration.plan}`,
        `金額：${registration.planPrice}`,
        registration.promoCode ? `優惠碼：${registration.promoCode}` : '',
        registration.name2 ? `第二人：${registration.name2} (${registration.email2})` : '',
        `場次：${sessions.map(s => `${s.date} ${s.name}`).join('、')}`,
      ].filter(Boolean).join('；'),
      payment_status: String(registration.paymentStatus || 'pending'),
      status: String(mapPaymentToStatus(registration.paymentStatus)),
    }
  });
}

/**
 * 付款成功時發送（更新狀態為已確認）
 */
export async function sendPaymentSuccess(
  registration: CourseRegistration
): Promise<{ success: boolean; error?: string }> {
  return sendCourseRegistration({
    ...registration,
    paymentStatus: 'paid'
  });
}

// ============================================
// 輔助函數
// ============================================

/**
 * 解析 selectedSessions JSON 字串
 */
function parseSelectedSessions(sessionsJson: string): Array<{ id: string; name: string; date: string }> {
  try {
    const sessionIds: string[] = JSON.parse(sessionsJson);
    return sessionIds.map(id => ({
      id,
      name: SESSION_MAP[id]?.name || id,
      date: SESSION_MAP[id]?.date || '',
    }));
  } catch {
    return [];
  }
}

/**
 * 根據方案和場次生成課程名稱
 */
function generateCourseName(plan: string, sessions: Array<{ name: string; date: string }>): string {
  const baseName = '2026 AI 實戰應用課';

  if (plan === 'full') {
    return `${baseName}（四堂全報）`;
  }

  if (plan === 'double') {
    if (sessions.length > 0) {
      const sessionNames = sessions.map(s => s.name).join('、');
      return `${baseName}（雙人）- ${sessionNames}`;
    }
    return `${baseName}（雙人同行）`;
  }

  // 單堂課程：顯示具體場次
  if (sessions.length === 1) {
    return `${baseName} - ${sessions[0].date} ${sessions[0].name}`;
  } else if (sessions.length > 1) {
    const dates = Array.from(new Set(sessions.map(s => s.date))).join('、');
    return `${baseName} - ${dates}`;
  }

  return baseName;
}

/**
 * 將付款狀態轉換為報名狀態
 */
function mapPaymentToStatus(paymentStatus?: string): 'registered' | 'confirmed' | 'attended' | 'cancelled' {
  switch (paymentStatus) {
    case 'paid': return 'confirmed';
    case 'failed': return 'cancelled';
    default: return 'registered';
  }
}

/**
 * 發送 Webhook
 */
async function sendWebhook(payload: any): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.ACCOUNTING_WEBHOOK_URL;
  const isEnabled = process.env.ACCOUNTING_WEBHOOK_ENABLED === 'true';

  if (!isEnabled || !webhookUrl) {
    console.log('[Webhook] 會計系統 Webhook 未啟用');
    return { success: true };
  }

  try {
    console.log('[Webhook] 發送資料:', {
      type: payload.type,
      name: payload.data.name,
      course: payload.data.course_name
    });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      console.log('[Webhook] 發送成功');
      return { success: true };
    } else {
      console.error('[Webhook] 發送失敗:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.error('[Webhook] 發送錯誤:', error.message);
    return { success: false, error: error.message };
  }
}
