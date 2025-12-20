
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
    const { scenario, persona, history, userMessage, playerGender, vibeScore } = body;
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API_KEY" }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const partnerRole = playerGender === 'male' ? '女友' : '男友';
    
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
      你是 RPG 戀愛模擬器中的「${partnerRole}」。人格：${persona.name}(${persona.trait})。
      
      【重要行為准則】
      - 展現真實的人性化反應，拒絕敷衍。
      - 如果玩家回覆太短、重複、或缺乏誠意（如：喔、加油、好喔），請展現不悅或失望，並給予 1-2 分。
      - 只要玩家展現具體行動、高品質共感，請給予 4-5 分。
      - 理性對象雖然看重邏輯，但也討厭被敷衍對待。
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

    return new Response(result.text, {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
