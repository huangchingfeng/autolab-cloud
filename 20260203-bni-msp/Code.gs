/**
 * BNI MSP 初階培訓課程 - Google Apps Script 後端
 *
 * 使用方式：
 * 1. 建立 Google Sheet「BNI MSP 20260203 報名」
 * 2. 開啟 Apps Script（擴充功能 > Apps Script）
 * 3. 貼上此程式碼
 * 4. 部署為 Web App（Deploy > New deployment > Web App）
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. 複製部署網址，貼到 index.html 的 GAS_URL
 * 6. 手動執行一次 setupTriggers() 設定排程提醒
 */

// ====== 設定 ======
const SHEET_NAME = 'Sheet1';
const COURSE_DATE = '2026/2/3（二）';
const COURSE_TIME = '19:30 - 22:00';
const COURSE_TITLE = 'MSP BNI 初階培訓課程';

// ====== doPost：接收報名 ======
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { name, chapter, phone, email } = data;

    // 驗證必填欄位
    if (!name || !chapter || !phone || !email) {
      return jsonResponse({ success: false, message: '請填寫所有必填欄位' });
    }

    // 驗證 email 格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ success: false, message: '請輸入有效的 Email' });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // 檢查重複報名（用 Email 判斷）
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][4] && existingData[i][4].toString().toLowerCase() === email.toLowerCase()) {
        return jsonResponse({ success: false, message: '此 Email 已經報名過囉！' });
      }
    }

    // 寫入 Google Sheets
    const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
    sheet.appendRow([timestamp, name, chapter, phone, email]);

    // 發送確認信
    sendConfirmationEmail(name, chapter, email);

    return jsonResponse({ success: true, message: '報名成功！確認信已寄出。' });

  } catch (err) {
    return jsonResponse({ success: false, message: '系統錯誤，請稍後再試：' + err.message });
  }
}

// ====== doGet：回傳報名統計 ======
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    const stats = {};
    let total = 0;

    // 從第 2 列開始（第 1 列是標題）
    for (let i = 1; i < data.length; i++) {
      const chapter = data[i][2]; // 分會欄位
      if (chapter) {
        stats[chapter] = (stats[chapter] || 0) + 1;
        total++;
      }
    }

    return jsonResponse({ stats, total });

  } catch (err) {
    return jsonResponse({ stats: {}, total: 0 });
  }
}

// ====== 發送確認信 ======
function sendConfirmationEmail(name, chapter, email) {
  const subject = `【報名確認】${COURSE_TITLE} - ${COURSE_DATE}`;
  const body = `
${name} 你好！

你已成功報名「${COURSE_TITLE}」，以下是課程資訊：

■ 日期：${COURSE_DATE}
■ 時間：${COURSE_TIME}
■ 方式：線上視訊（Zoom）
■ 報名分會：${chapter}

■ Zoom 會議連結：https://us06web.zoom.us/j/2782374768

【提醒事項】
- 請全程開啟鏡頭
- 請準時出席（19:30 準時開始）

如有任何問題，請聯繫你的分會教育委員。

黃敬峰（阿峰老師）
華字輩區域培訓董事顧問
專業別：AI 應用與導入顧問
BNI 新北市西B區
  `.trim();

  GmailApp.sendEmail(email, subject, body);
}

// ====== 發送提醒信 ======
function sendReminderEmails() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  const subject = `【課前提醒】${COURSE_TITLE} - 明天見！`;

  for (let i = 1; i < data.length; i++) {
    const name = data[i][1];
    const email = data[i][4];

    if (!email) continue;

    const body = `
${name} 你好！

提醒你「${COURSE_TITLE}」即將開始：

■ 日期：${COURSE_DATE}
■ 時間：${COURSE_TIME}
■ 方式：線上視訊（Zoom）

■ Zoom 會議連結：https://us06web.zoom.us/j/2782374768

【請記得】
- 全程開啟鏡頭
- 準時出席（19:30 準時開始）

期待明天見！

黃敬峰（阿峰老師）
華字輩區域培訓董事顧問
專業別：AI 應用與導入顧問
BNI 新北市西B區
    `.trim();

    try {
      GmailApp.sendEmail(email, subject, body);
    } catch (err) {
      Logger.log('寄信失敗：' + email + ' - ' + err.message);
    }
  }

  Logger.log('提醒信已全部寄出，共 ' + (data.length - 1) + ' 封');
}

// ====== 當天提醒信 ======
function sendDayOfReminder() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  const subject = `【今日課程】${COURSE_TITLE} - 今晚 19:30`;

  for (let i = 1; i < data.length; i++) {
    const name = data[i][1];
    const email = data[i][4];

    if (!email) continue;

    const body = `
${name} 你好！

今晚就是「${COURSE_TITLE}」囉！

■ 時間：今晚 ${COURSE_TIME}
■ 方式：線上視訊（Zoom）

■ Zoom 會議連結：https://us06web.zoom.us/j/2782374768

【請記得】
- 全程開啟鏡頭
- 準時加入會議

今晚見！

黃敬峰（阿峰老師）
華字輩區域培訓董事顧問
專業別：AI 應用與導入顧問
BNI 新北市西B區
    `.trim();

    try {
      GmailApp.sendEmail(email, subject, body);
    } catch (err) {
      Logger.log('寄信失敗：' + email + ' - ' + err.message);
    }
  }

  Logger.log('當天提醒信已全部寄出');
}

// ====== 設定排程觸發器（手動執行一次）======
function setupTriggers() {
  // 清除舊的觸發器
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));

  // 前一天提醒：2026/2/2 10:00
  ScriptApp.newTrigger('sendReminderEmails')
    .timeBased()
    .at(new Date('2026-02-02T10:00:00+08:00'))
    .create();

  // 當天提醒：2026/2/3 10:00
  ScriptApp.newTrigger('sendDayOfReminder')
    .timeBased()
    .at(new Date('2026-02-03T10:00:00+08:00'))
    .create();

  Logger.log('觸發器設定完成：2/2 前一天提醒 + 2/3 當天提醒');
}

// ====== 初始化 Sheet 標題列（手動執行一次）======
function initSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, 5).getValues()[0];

  // 如果第一列是空的，寫入標題
  if (!headers[0]) {
    sheet.getRange(1, 1, 1, 5).setValues([['時間戳記', '姓名', '分會', '電話', 'Email']]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  }

  Logger.log('Sheet 初始化完成');
}

// ====== 工具函數 ======
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
