
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
 * 格式化錯誤訊息，將 API 的 JSON 錯誤轉換為用戶看得懂的中文
 */
const formatErrorMessage = (error: any): string => {
  const msg = error?.message || String(error);
  if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
    return "目前的練習人數較多（已達 API 限額），AI 導師正在喝口水休息。請稍等約 30-60 秒後再試一次，感謝你的耐心！";
  }
  if (msg.includes("500") || msg.includes("Internal Server Error")) {
    return "伺服器似乎有點頭暈，暫時無法回應。請重新整理頁面試試看。";
  }
  return "連線稍微不穩定，請檢查網路環境或稍後再試。";
};

export const generateReplyAndFeedback = async (
  scenario: ScenarioData,
  history: { role: 'user' | 'model', content: string }[],
  userMessage: string
): Promise<AIResponseSchema> => {
  const apiKey = process.env.API_KEY;

  // --- 1. 嘗試直連 Google ---
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `
        你是一位感情經營大師。目前練習情境是「${scenario.title}」。
        
        【行為準則】
        1. 女友身份：請表現得像個真實的人。如果用戶敷衍（如只回一個字、亂打字、123），請表現出不悅、困惑或撒嬌吐槽，不要生硬配合。
        2. 導師身份：若用戶表現差，評分 1-2 分，並明確解釋為什麼這樣的溝通會讓對方感到心寒。
      `;

      // 使用最節省資源的模型：gemini-flash-lite-latest
      const response = await ai.models.generateContent({
        model: "gemini-flash-lite-latest",
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
    } catch (directError: any) {
      console.warn("Direct connection failed:", directError);
      if (directError.message?.includes("429")) {
        return {
          girlfriendReply: "（親愛的，我這裡收訊有點卡住，可以稍等我一分鐘嗎？）",
          coachFeedback: {
            score: 0,
            comment: formatErrorMessage(directError),
            suggestion: "先深呼吸一下，思考一下更有溫度的回覆方式吧！"
          }
        };
      }
    }
  }

  // --- 2. 伺服器代理備援 ---
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, history, userMessage }),
    });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}`);
    }
    
    return data as AIResponseSchema;
  } catch (proxyError: any) {
    console.error("連線全面失效:", proxyError);
    return {
      girlfriendReply: "（哎呀，我的網路好像斷斷續續的...你剛剛說什麼？可以再對我說一次嗎？）",
      coachFeedback: {
        score: 0,
        comment: formatErrorMessage(proxyError),
        suggestion: "這可能是因為網路限制或 API 流量管制。建議檢查連線，或稍等一會再試。"
      }
    };
  }
};
