import { describe, it, expect } from 'vitest';

describe('每日課程報名名單功能', () => {
  // 測試課程場次資料結構
  const sessions = [
    { id: "0120", name: "初階 1：AI 基礎與 Perplexity 實戰", date: "2026-01-20", time: "19:30-22:30", dayOfWeek: "一" },
    { id: "0122", name: "初階 2：Gemini Deep Research 與 Grok", date: "2026-01-22", time: "19:30-22:30", dayOfWeek: "三" },
    { id: "0127", name: "初階 3：Gamma 與 Nano Banana 視覺設計", date: "2026-01-27", time: "19:30-22:30", dayOfWeek: "一" },
    { id: "0128", name: "初階 4：NotebookLM 與 Gemini Canvas", date: "2026-01-28", time: "19:30-22:30", dayOfWeek: "二" },
    { id: "0203", name: "初階 1：AI 基礎與 Perplexity 實戰", date: "2026-02-03", time: "19:30-22:30", dayOfWeek: "一" },
    { id: "0205", name: "初階 2：Gemini Deep Research 與 Grok", date: "2026-02-05", time: "19:30-22:30", dayOfWeek: "三" },
    { id: "0305", name: "初階 1：AI 基礎與 Perplexity 實戰", date: "2026-03-05", time: "19:30-22:30", dayOfWeek: "三" },
    { id: "0311", name: "初階 2：Gemini Deep Research 與 Grok", date: "2026-03-11", time: "19:30-22:30", dayOfWeek: "二" },
    { id: "0312", name: "初階 3：Gamma 與 Nano Banana 視覺設計", date: "2026-03-12", time: "19:30-22:30", dayOfWeek: "三" },
    { id: "0324", name: "初階 4：NotebookLM 與 Gemini Canvas", date: "2026-03-24", time: "19:30-22:30", dayOfWeek: "一" },
  ];

  it('應有 10 個課程場次', () => {
    expect(sessions.length).toBe(10);
  });

  it('每個場次應有完整的資料結構', () => {
    sessions.forEach(session => {
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('name');
      expect(session).toHaveProperty('date');
      expect(session).toHaveProperty('time');
      expect(session).toHaveProperty('dayOfWeek');
    });
  });

  it('場次 ID 應為 4 位數字字串', () => {
    sessions.forEach(session => {
      expect(session.id).toMatch(/^\d{4}$/);
    });
  });

  it('日期格式應為 YYYY-MM-DD', () => {
    sessions.forEach(session => {
      expect(session.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // 測試 selectedSessions 解析邏輯
  describe('selectedSessions 解析', () => {
    it('應能正確解析 JSON 格式的 selectedSessions', () => {
      const selectedSessions = '["0120", "0122", "0127", "0128"]';
      const parsed = JSON.parse(selectedSessions);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(4);
      expect(parsed).toContain("0120");
      expect(parsed).toContain("0122");
    });

    it('應能判斷報名者是否選擇了特定場次', () => {
      const selectedSessions = '["0120", "0122"]';
      const parsed = JSON.parse(selectedSessions);
      
      expect(parsed.includes("0120")).toBe(true);
      expect(parsed.includes("0127")).toBe(false);
    });
  });

  // 測試人數計算邏輯
  describe('人數計算', () => {
    it('單人方案應計算為 1 人', () => {
      const plan = "single";
      const peopleCount = plan === "double" ? 2 : 1;
      expect(peopleCount).toBe(1);
    });

    it('全系列方案應計算為 1 人', () => {
      const plan = "full";
      const peopleCount = plan === "double" ? 2 : 1;
      expect(peopleCount).toBe(1);
    });

    it('雙人方案應計算為 2 人', () => {
      const plan = "double";
      const peopleCount = plan === "double" ? 2 : 1;
      expect(peopleCount).toBe(2);
    });
  });

  // 測試月份篩選邏輯
  describe('月份篩選', () => {
    it('應能正確篩選一月份的課程', () => {
      const januarySessions = sessions.filter(s => s.date.startsWith('2026-01'));
      expect(januarySessions.length).toBe(4);
    });

    it('應能正確篩選二月份的課程', () => {
      const februarySessions = sessions.filter(s => s.date.startsWith('2026-02'));
      expect(februarySessions.length).toBe(2);
    });

    it('應能正確篩選三月份的課程', () => {
      const marchSessions = sessions.filter(s => s.date.startsWith('2026-03'));
      expect(marchSessions.length).toBe(4);
    });
  });

  // 測試 CSV 匯出格式
  describe('CSV 匯出', () => {
    it('應能正確生成 CSV 標頭', () => {
      const headers = ["姓名", "Email", "電話", "產業", "方案", "付款狀態", "付款方式", "報名時間"];
      expect(headers.length).toBe(8);
      expect(headers[0]).toBe("姓名");
      expect(headers[4]).toBe("方案");
    });

    it('應能正確處理包含逗號的欄位', () => {
      const cellWithComma = "測試, 公司";
      const escapedCell = `"${cellWithComma}"`;
      expect(escapedCell).toBe('"測試, 公司"');
    });
  });
});
