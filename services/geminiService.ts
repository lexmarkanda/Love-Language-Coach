
import { GoogleGenAI, Type } from "@google/genai";
import { ScenarioData, AIResponseSchema } from './types';

// Shared Response Schema
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
 * Smart Routing: 
 * 1. Try Direct Call (Google API) - Best for Taiwan/Global users.
 * 2. Fallback to Proxy (/api/generate) - Essential for HK/Mainland users.
 */
export const generateReplyAndFeedback = async (
  scenario: ScenarioData,
  history: { role: 'user' | 'model', content: string }[],
  userMessage: string
): Promise<AIResponseSchema> => {
  // Use process.env.API_KEY as requested. 
  // Note: In some environments, this might be injected into window.process.env or handled by the bundler.
  const apiKey = (window as any).process?.env?.API_KEY || (import.meta as any).env?.VITE_API_KEY;

  // --- Path 1: Direct Call (Fastest for Taiwan) ---
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `
        你是一位頂尖的感情經營大師。目標是引導用戶練習高品質的親密溝通。
        
        【目前情境】: ${scenario.title} - ${scenario.description}
        
        【互動行為準則】
        1. 女友身份：請根據情境做出反應。如果用戶的回覆「文不對題」、「極度敷衍（如：喔、嗯、123）」或「態度隨便」，請不要生硬配合，而是表現出真實的情緒反應（例如：感到被冷落、撒嬌吐槽或困惑）。
        2. 導師身份：嚴格評分。若用戶敷衍或亂回，給予 1-2 分，並解釋為什麼這樣的互動對感情有害。
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
      console.warn("Direct path failed (likely network block or API issue), falling back to proxy...", directError);
    }
  }

  // --- Path 2: Proxy Fallback (Support for HK/Vercel) ---
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, history, userMessage }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Proxy request failed');
    }
    
    return await response.json() as AIResponseSchema;
  } catch (proxyError) {
    console.error("Critical: Both connection paths failed.", proxyError);
    
    // Final UI Fallback: Return a realistic "connection issue" message in character
    return {
      girlfriendReply: "親愛的，我這邊訊號好像突然斷斷續續的...你剛剛說的話我沒聽清楚，可以再說一次嗎？",
      coachFeedback: {
        score: 0,
        comment: "連線異常：無法接觸到 AI 導師伺服器。",
        suggestion: "這可能是因為您所在的地區網路受到限制（如香港）。請檢查 VPN 設定，或稍後再試一次。"
      }
    };
  }
};
