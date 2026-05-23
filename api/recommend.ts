import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 提示詞模板「語意推薦」端點：收使用者需求 + 模板清單，請 Gemini 挑最相關的前 5 個。
// 金鑰只在伺服器端（process.env.GEMINI_API_KEY），不會進前端。
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const need = String(body.need || '').slice(0, 500).trim();
    const candidates = Array.isArray(body.candidates) ? body.candidates.slice(0, 400) : [];

    if (!need || candidates.length === 0) {
      res.status(400).json({ error: 'need 與 candidates 為必填' });
      return;
    }

    const list = candidates
      .map((c: any, i: number) => `${i + 1}. [${String(c.id)}] ${String(c.name || '')}（${String(c.category || '')}）`)
      .join('\n');

    const prompt = `你是企業 AI 工具的提示詞推薦助手。使用者想完成的工作是：「${need}」。

以下是可用的提示詞模板清單（格式：編號. [id] 名稱（分類））：
${list}

請從清單中挑出「最能幫使用者完成這件事」的最多 5 個模板，依相關度由高到低排序。
規則：
- 只能挑清單裡確實存在的模板，id 必須與清單中的完全一致，絕不可捏造。
- 若清單中沒有任何相關模板，results 回傳空陣列。
只回傳 JSON 物件，格式：{"results":[{"id":"<清單中的id>","reason":"<20字內繁體中文，說明為何推薦>"}]}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { results: [] };
    }

    const validIds = new Set(candidates.map((c: any) => String(c.id)));
    const rawResults = Array.isArray(parsed?.results) ? parsed.results : [];
    const results = rawResults
      .filter((r: any) => r && validIds.has(String(r.id)))
      .slice(0, 5)
      .map((r: any) => ({ id: String(r.id), reason: String(r.reason || '').slice(0, 40) }));

    res.status(200).json({ results });
  } catch (err: any) {
    console.error('recommend error:', err?.message || err);
    res.status(500).json({ error: 'AI 推薦失敗' });
  }
}
