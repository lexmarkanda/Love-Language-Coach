
import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { scenario, history, userMessage } = await req.json();

    // 這裡的 process.env.API_KEY 是 Vercel 伺服器端的環境變數
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const RESPONSE_SCHEMA = {
      type: Type.OBJECT,
      properties: {
        girlfriendReply: {
          type: Type.STRING,
          description: "女友身分的自然回覆內容",
        },
        coachFeedback: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "1-5 分的評分" },
            comment: { type: Type.STRING, description: "對用戶回覆的簡短評論" },
            suggestion: { type: Type.STRING, description: "更好的浪漫表達建議" },
          },
          required: ["score", "comment", "suggestion"],
        },
      },
      required: ["girlfriendReply", "coachFeedback"],
    };

    const systemInstruction = `
      你是一位感情導師。目前的目標是幫助用戶（男性）練習如何對女友表達愛意。
      
      請以兩個身分同時運作：
      1. 女友：根據情境「${scenario.title}」做出感性的回覆。
      2. 導師：分析用戶的表達（是否太單調？），給予 1-5 分並提供一個更具體、更浪漫的改寫建議。
      
      目前的初始情境：${scenario.introMessage}
      情境重點：${scenario.description}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map((msg: any) => ({
          role: msg.role,
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

    return new Response(response.text, {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Gemini API Proxy Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
