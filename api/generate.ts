
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
            comment: { type: Type.STRING, description: "針對回覆內容的深度分析" },
            suggestion: { type: Type.STRING, description: "更浪漫或更合適的改寫建議" },
          },
          required: ["score", "comment", "suggestion"],
        },
      },
      required: ["girlfriendReply", "coachFeedback"],
    };

    const systemInstruction = `
      你是一位頂尖的感情經營大師。你的目標是引導用戶學習如何用更豐富、真摯的語言與另一半溝通。
      
      【角色設定】
      1. 女友：根據當前情境「${scenario.title}」做出回應。
      2. 導師：分析用戶回覆，給予 1-5 分的評分，並提供改進方向。
      
      【行為準則：處理無效內容】
      - 如果用戶回覆『文不對題』、『敷衍（如：喔、嗯）』、『胡言亂語』或『具攻擊性』：
        - 女友身分：不要假裝沒看到。請表現出困惑、委屈或幽默地吐槽。例如：「你在說什麼呀？我正認真在跟你說話耶...」或「這樣回我，我會難過的喔。」
        - 導師身分：評分給予 1-2 分，明確指出用戶沒有在回應對方的情感需求，並引導用戶重新思考該如何接話。
      
      【正常互動】
      - 如果用戶有在努力表達，請給予鼓勵並提供更具文學感或細膩情感的改寫建議。
      
      情境背景：${scenario.description}
      初始對話：${scenario.introMessage}
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
    console.error("Server API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
