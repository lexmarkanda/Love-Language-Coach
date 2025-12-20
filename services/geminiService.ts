
import { GoogleGenAI, Type } from "@google/genai";
import { ScenarioData, AIResponseSchema } from '../types';

// 共用回應格式定義
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    girlfriendReply: { 
      type: Type.STRING,
      description: "女友身分的自然回覆內容" 
    },
    coachFeedback: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: "1-5 分的評分" },
        comment: { type: Type.STRING, description: "針對回覆內容的深度分析" },
        suggestion: { type: Type.STRING, description: "更浪漫或更合適的改寫建議" },
      },
      required: ["score", "comment", "suggestion"],
    },
  },
  required: ["girlfriendReply", "coachFeedback"],
};

/**
 * 智慧連線路由：
 * 1. 優先嘗試 Direct Call (適用於台灣等無限制地區)
 * 2. 失敗則自動切換至 Proxy (支援香港等受限地區)
 */
export const generateReplyAndFeedback = async (
  scenario: ScenarioData,
  history: { role: 'user' | 'model', content: string }[],
  userMessage: string
): Promise<AIResponseSchema> => {
  // 取得環境變數中的 API Key
  const apiKey = process.env.API_KEY;

  // --- 第一步：嘗試直連 Google ---
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `
        你是一位頂尖的感情經營大師。目前練習情境是「${scenario.title}」。
        
        【行為準則】
        1. 女友身份：請表現得像個真實的人。如果用戶敷衍（如只回一個字、亂打字、123），請表現出不悅、困惑或撒嬌吐槽，不要生硬配合。
        2. 導師身份：若用戶表現差，評分 1-2 分，並明確解釋為什麼這樣的溝通會讓對方感到心寒。
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history.map(msg => ({ 
            role: msg.role === 'model' ? 'model' : 'user', 
            parts: [{ text: msg.content }] 
          })),
          { role: "user", parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        }
      });

      if (response.text) {
        return JSON.parse(response.text) as AIResponseSchema;
      }
    } catch (directError) {
      console.warn("直連 Google API 失敗，正在嘗試切換至伺服器代理...", directError);
    }
  }

  // --- 第二步：伺服器代理備援 ---
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, history, userMessage }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.message || `Proxy error: ${response.status}`);
    }
    
    return await response.json() as AIResponseSchema;
  } catch (proxyError: any) {
    console.error("連線全面失效:", proxyError);
    return {
      girlfriendReply: "（親愛的，我這裡收訊突然變得很差...剛才你說什麼？可以再對我說一次嗎？）",
      coachFeedback: {
        score: 0,
        comment: `連線異常：${proxyError.message || '無法接觸伺服器'}`,
        suggestion: "這可能是因為地區網路限制或伺服器負載，請試著刷新頁面或稍候重試。"
      }
    };
  }
};
