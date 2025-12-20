
import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();
    const { scenario, history, userMessage } = body;
    
    // Obtain API key strictly from environment
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("Backend Error: API_KEY is missing from environment variables.");
      return new Response(JSON.stringify({ error: "Missing API_KEY on server configuration" }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    
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

    const systemInstruction = `
      你是一位專門研究「情緒價值」的頂尖感情教練。
      
      【任務描述】
      引導用戶在對話情境「${scenario.title}」中學習細膩、真誠且具有溫度的溝通。
      
      【角色互動邏輯】
      1. 女友身分：請保持對話的連續性。但是，如果用戶輸入的是無意義的內容（如單個字「喔」、「嗯」、隨機字符、或完全不相關的回答），女友應表現出真實的情緒反應：可能是困惑、覺得被冷落、或是調皮地吐槽用戶在敷衍。
      2. 導師身分：
         - 高分 (4-5)：展現了共情能力，回應了對方的感受。
         - 低分 (1-2)：輸入敷衍、牛頭不對馬嘴、或缺乏情緒價值的例行公事回答。
         - 必須給出具体的「改寫建議」，讓對話更具感染力。

      情境背景：${scenario.description}
    `;

    // Use gemini-3-flash-preview for speed and intelligence
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map((msg: any) => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        {
          role: "user",
          parts: [{ text: userMessage }]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      }
    });

    const text = result.text;
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    return new Response(text, {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Vercel Edge Function Error:", error);
    
    // Return a structured error response that the frontend can still render gracefully
    return new Response(JSON.stringify({ 
      error: "AI Service Error", 
      message: error.message,
      girlfriendReply: "（哎呀，我的訊號好像斷了...）",
      coachFeedback: {
        score: 0,
        comment: `發生錯誤：${error.message}`,
        suggestion: "這可能是 API 額度達到上限或伺服器繁忙，請稍等幾秒後重試。"
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
