
import { GoogleGenAI, Type } from "@google/genai";
import { ScenarioData, AIResponseSchema } from '@/types';

// 共用的 Response Schema 定義
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    girlfriendReply: { 
      type: Type.STRING,
      description: "女友身分的自然回覆" 
    },
    coachFeedback: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: "1-5 分" },
        comment: { type: Type.STRING, description: "對溝通質量的點評" },
        suggestion: { type: Type.STRING, description: "更優質的建議" },
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
  const apiKey = process.env.API_KEY;

  // 1. 優先嘗試：直連 Google API (適用於台灣、美國等地區)
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `
        你是一位感情大師。目前的任務是根據情境「${scenario.title}」協助用戶練習溝通。
        
        【行為準則】
        - 女友身分：請保持真實感。如果用戶亂回話、敷衍（如：喔、嗯）或文不對題，請表現出困惑、被冷落或撒嬌轉場，不要生硬地接下去。
        - 導師身分：如果用戶互動質量差，評分給 1-2 分，並解釋為什麼這樣的回答會讓感情降溫。
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
      console.warn("Direct connection failed, switching to proxy...", directError);
      // 直連失敗（常見於香港地區），繼續執行下方的 proxy 邏輯
    }
  }

  // 2. 備援方案：呼叫 Vercel API Proxy (伺服器端中轉)
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, history, userMessage }),
    });

    if (!response.ok) throw new Error('Proxy endpoint error');
    return await response.json() as AIResponseSchema;
  } catch (proxyError) {
    console.error("Critical: Both connection paths failed.", proxyError);
    return {
      girlfriendReply: "親愛的，我這邊收訊好像不太好...你剛剛說什麼？可以再說一次嗎？",
      coachFeedback: {
        score: 0,
        comment: "目前與心靈導師的連線不穩定，請檢查網路環境。",
        suggestion: "請試著縮短回覆或重新啟動應用程式。"
      }
    };
  }
};
