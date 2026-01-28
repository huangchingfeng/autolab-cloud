import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "./_core/env";

const genAI = new GoogleGenerativeAI(ENV.geminiApiKey);

export type SupportedLanguage = "zh-TW" | "zh-CN" | "en" | "ko" | "ja";

const languageNames: Record<SupportedLanguage, string> = {
  "zh-TW": "Traditional Chinese (Taiwan)",
  "zh-CN": "Simplified Chinese",
  en: "English",
  ko: "Korean",
  ja: "Japanese",
};

/**
 * 使用 Gemini API 翻譯文字
 * @param text 要翻譯的文字
 * @param targetLanguage 目標語言
 * @returns 翻譯後的文字
 */
export async function translateText(
  text: string,
  targetLanguage: SupportedLanguage
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // 如果目標語言是繁體中文，直接返回原文
  if (targetLanguage === "zh-TW") {
    return text;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `You are a professional translator. Translate the following text to ${languageNames[targetLanguage]}.

IMPORTANT RULES:
1. Only return the translated text, no explanations or additional content
2. Preserve all HTML tags, markdown formatting, and special characters exactly as they are
3. Do not translate technical terms, brand names, or proper nouns
4. Maintain the same tone and style as the original text
5. If the text contains multiple paragraphs, preserve the paragraph structure

Text to translate:
${text}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const translatedText = response.text();

  return translatedText.trim();
}

/**
 * 批次翻譯多個文字片段
 * @param texts 要翻譯的文字陣列
 * @param targetLanguage 目標語言
 * @returns 翻譯後的文字陣列
 */
export async function translateBatch(
  texts: string[],
  targetLanguage: SupportedLanguage
): Promise<string[]> {
  // 如果目標語言是繁體中文，直接返回原文
  if (targetLanguage === "zh-TW") {
    return texts;
  }

  // 過濾空字串
  const nonEmptyTexts = texts.filter((t) => t && t.trim().length > 0);
  if (nonEmptyTexts.length === 0) {
    return texts;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  // 將所有文字組合成一個請求，用特殊分隔符分開
  const separator = "\n<<<SEPARATOR>>>\n";
  const combinedText = nonEmptyTexts.join(separator);

  const prompt = `You are a professional translator. Translate the following texts to ${languageNames[targetLanguage]}.

IMPORTANT RULES:
1. The input contains multiple text segments separated by "<<<SEPARATOR>>>"
2. Translate each segment separately and return them in the same order
3. Use the same separator "<<<SEPARATOR>>>" between translated segments
4. Only return the translated texts with separators, no explanations
5. Preserve all HTML tags, markdown formatting, and special characters exactly as they are
6. Do not translate technical terms, brand names, or proper nouns
7. Maintain the same tone and style as the original texts

Texts to translate:
${combinedText}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const translatedText = response.text();

  // 分割翻譯結果
  const translatedSegments = translatedText
    .split(separator)
    .map((t: string) => t.trim());

  // 重建完整陣列（包含原本的空字串）
  let segmentIndex = 0;
  return texts.map((originalText) => {
    if (!originalText || originalText.trim().length === 0) {
      return originalText;
    }
    return translatedSegments[segmentIndex++] || originalText;
  });
}
