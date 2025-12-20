
import { GoogleGenAI, Type } from "@google/genai";
import { ScenarioData, AIResponseSchema } from '@/types';

// 定義 Schema 供前端 Direct Call 使用
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    girlfriendReply: { type: Type.STRING },
    coachFeedback: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        comment: { type: Type.STRING },
        suggestion: { type: Type.STRING },
      },
      required: ["score", "comment", "suggestion"],
    },
  },
  required: ["girlfriendReply", "coachFeedback"],
};

export const generateReplyAndFeedback = async (
  scenario: ScenarioData,
  history: { role: 'user' | 'model', content: string }[],
  userMessage: string
): Promise<AIResponseSchema> => {
  const apiKey = (import.meta as any).env.VITE_API_KEY;

  // 策略：如果是台灣或其他可直連區域，且有 API_KEY，優先嘗試直連以降低延遲
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `
        你是一位感情經營大師。幫助用戶練習表達愛意。
        情境：${scenario.title} (${scenario.description})
        
        若用戶亂回話（文不對題、敷衍）：
        - 女友：表現出困惑或撒嬌轉場，要把話題拉回來。
        - 導師：給予低分並指導用戶該如何關注對方的情緒。
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history.map(msg => ({ role: msg.role, parts: [{ text: msg.content }] })),
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
      console.warn("Direct connection to Google API failed, falling back to proxy...", directError);
      // 如果直連失敗（可能是被牆或網路問題），則不 return，繼續執行下方的 proxy 邏輯
    }
  }

  // 降級方案：透過 Vercel Serverless Function 中轉 (支援香港等受限地區)
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, history, userMessage }),
    });

    if (!response.ok) throw new Error('Proxy API request failed');
    return await response.json() as AIResponseSchema;
  } catch (proxyError) {
    console.error("Both direct and proxy attempts failed:", proxyError);
    return {
      girlfriendReply: "親愛的，我現在心跳好快...快到通訊中斷了，可以再跟我說一次嗎？",
      coachFeedback: {
        score: 0,
        comment: "連線極度不穩定",
        suggestion: "這可能是網路暫時性的問題，或者是您的回覆內容讓伺服器害羞到斷線了。請再試一次！"
      }
    };
  }
};
