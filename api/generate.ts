
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
      - 你必須通人性、懂得感恩。當玩家主動提供幫助、買東西、給予體貼建議時，你應該感到溫暖並軟化態度。
      - 禁止將主動幫助誤判為命令。
      - 只要玩家有誠意、具體關心，請給予 4-5 分。
      - 分析報告要指出玩家「好意」的閃光點。
    `;

    const result = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
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
