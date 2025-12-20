
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
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: "Configuration Error", 
        message: "伺服器端缺少 API_KEY，請確認環境變數設定。" 
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
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
      你是一位專門研究「情緒價值」的感情教練，正在指導用戶在「${scenario.title}」情境下的對話。
      
      【角色設定】
      1. 女友：正與用戶互動。如果用戶敷衍、字數過短或內容無意義，請展現真實反應（如失望、困惑、嬌嗔要求認真回答）。
      2. 導師：理性的評論者。敷衍的回答應給予 1-2 分，並提供具體的改進建議。
    `;

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

    const outputText = result.text;
    if (!outputText) throw new Error("AI 未回傳任何內容");

    return new Response(outputText, {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Vercel Edge Function Error:", error);
    return new Response(JSON.stringify({ 
      error: "Proxy Failure", 
      message: error.message || "發生未知錯誤",
      girlfriendReply: "（通訊中斷中...）",
      coachFeedback: {
        score: 0,
        comment: `伺服器處理失敗: ${error.message}`,
        suggestion: "可能是 API 額度限制，請稍候重試。"
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
