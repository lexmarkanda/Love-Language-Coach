
import { GoogleGenAI, Type } from "@google/genai";
import { ScenarioData, AIResponseSchema } from '@/types';

export const generateReplyAndFeedback = async (
  scenario: ScenarioData,
  history: { role: 'user' | 'model', content: string }[],
  userMessage: string
): Promise<AIResponseSchema> => {
  // Always use process.env.API_KEY directly when initializing the client.
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(msg => ({
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

    // Directly access the .text property from the response object.
    const text = response.text;
    return JSON.parse(text || '{}') as AIResponseSchema;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      girlfriendReply: "親愛的，我現在有點累，晚點再聊好嗎？",
      coachFeedback: {
        score: 0,
        comment: "連線目前不穩定",
        suggestion: "請稍後再試一次。"
      }
    };
  }
};
