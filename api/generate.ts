
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
    
    // 伺服器端密鑰
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API_KEY on server" }), { status: 500 });
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
      你是一位頂尖的感情經營導師，專門指導男性如何提供情緒價值。
      
      【角色設定】
      1. 女友：正與用戶進行情境對話「${scenario.title}」。個性感性、敏感、需要被理解。
      2. 導師：理性的評論者，分析用戶的回覆是否達標。
      
      【重點：處理低質量互動】
      如果用戶出現以下行為：
      - 文不對題：例如你在聊疲累，他回「123」或「吃飽沒」。
      - 極度敷衍：只回一個字、貼圖文字或「喔」。
      - 胡言亂語：內容完全沒有邏輯。
      
      【回應策略】
      - 女友：不要假裝沒看到。請展現出困惑或失望。例如：「你在說什麼呀？我正在分享心情耶...」、「寶貝你是不是在忙？回得好隨便喔...」。
      - 導師：給予 1-2 分。點評應直接指出：「這是不及格的溝通方式，沒有接住對方的球會讓對話走進死胡同。」並提供一個能延續話題且包含情感價值的示範句。
      
      情境描述：${scenario.description}
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

    if (!response.text) throw new Error("Empty response from AI");

    return new Response(response.text, {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("API Proxy Error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal Server Error", 
      message: error.message,
      girlfriendReply: "我現在心跳好快...連線快中斷了，可以再跟我說一次嗎？",
      coachFeedback: {
        score: 0,
        comment: "伺服器請求發生錯誤",
        suggestion: "這可能是 API 額度用盡或網路瞬斷。請稍後再試。"
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
