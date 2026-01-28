/**
 * LLM 服務 - 使用 Google Gemini API
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "model";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type MessageContent = string | TextContent | ImageContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
};

export type InvokeParams = {
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
};

export type InvokeResult = {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string;
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

// 初始化 Gemini 客戶端
function getGenAI() {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenerativeAI(ENV.geminiApiKey);
}

// 將 OpenAI 格式的 messages 轉換為 Gemini 格式
function convertToGeminiMessages(messages: Message[]) {
  const contents: Array<{
    role: "user" | "model";
    parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
  }> = [];

  let systemInstruction = "";

  for (const msg of messages) {
    // 處理 system message
    if (msg.role === "system") {
      const content = typeof msg.content === "string"
        ? msg.content
        : Array.isArray(msg.content)
          ? msg.content.map(c => typeof c === "string" ? c : c.type === "text" ? c.text : "").join("\n")
          : "";
      systemInstruction += content + "\n";
      continue;
    }

    // 轉換 role
    const role = msg.role === "assistant" || msg.role === "model" ? "model" : "user";

    // 轉換 content
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    const contentArray = Array.isArray(msg.content) ? msg.content : [msg.content];

    for (const content of contentArray) {
      if (typeof content === "string") {
        parts.push({ text: content });
      } else if (content.type === "text") {
        parts.push({ text: content.text });
      } else if (content.type === "image_url" && content.image_url.url) {
        // 處理 base64 圖片
        const url = content.image_url.url;
        if (url.startsWith("data:")) {
          const [header, base64Data] = url.split(",");
          const mimeType = header.match(/data:(.*?);/)?.[1] || "image/jpeg";
          parts.push({ inlineData: { mimeType, data: base64Data } });
        } else {
          // URL 圖片 - Gemini 需要先下載
          parts.push({ text: `[Image: ${url}]` });
        }
      }
    }

    if (parts.length > 0) {
      contents.push({ role, parts });
    }
  }

  return { contents, systemInstruction: systemInstruction.trim() || undefined };
}

/**
 * 呼叫 LLM
 */
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const genAI = getGenAI();

  const modelName = params.model || "gemini-2.0-flash-exp";
  const model = genAI.getGenerativeModel({ model: modelName });

  const { contents, systemInstruction } = convertToGeminiMessages(params.messages);

  try {
    const result = await model.generateContent({
      contents,
      systemInstruction,
      generationConfig: {
        maxOutputTokens: params.maxTokens || 8192,
        temperature: params.temperature || 0.7,
      },
    });

    const response = result.response;
    const text = response.text();

    return {
      id: `gemini-${Date.now()}`,
      model: modelName,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: text,
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 0, // Gemini API 不提供這個資訊
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  } catch (error) {
    console.error("[LLM] Gemini API error:", error);
    throw error;
  }
}

/**
 * 簡易版本 - 直接返回文字
 */
export async function generateText(
  prompt: string,
  options?: { model?: string; maxTokens?: number; temperature?: number }
): Promise<string> {
  const result = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
    ...options,
  });
  return result.choices[0]?.message.content || "";
}

/**
 * 聊天完成 - 支援多輪對話
 */
export async function chatCompletion(
  messages: Message[],
  options?: { model?: string; maxTokens?: number; temperature?: number }
): Promise<string> {
  const result = await invokeLLM({
    messages,
    ...options,
  });
  return result.choices[0]?.message.content || "";
}
