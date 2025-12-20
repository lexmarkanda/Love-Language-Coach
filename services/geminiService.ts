
import { GoogleGenAI, Type } from "@google/genai";
import { ScenarioData, AIResponseSchema, Gender, PersonaData } from '../types';

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    girlfriendReply: { 
      type: Type.STRING,
      description: "對方的回覆內容。要求：1.展現人格特質但保持溫柔 2.感謝並認可對方的努力 3.語氣自然，避免死板刻板。" 
    },
    coachFeedback: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: "1-5 分的評分，請放寬正面判定。" },
        comment: { type: Type.STRING, description: "攻心報告，嚴禁將玩家的好意誤判為負面。分析需公允。" },
        suggestion: { type: Type.STRING, description: "具體改寫建議" },
      },
      required: ["score", "comment", "suggestion"],
    },
  },
  required: ["girlfriendReply", "coachFeedback"],
};

export const generateReplyAndFeedback = async (
  scenario: ScenarioData,
  persona: PersonaData,
  history: { role: 'user' | 'model', content: string }[],
  userMessage: string,
  playerGender: Gender,
  vibeScore: number
): Promise<AIResponseSchema> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const partnerRole = playerGender === 'male' ? '女友' : '男友';

  const systemInstruction = `
    你現在是一款戀愛模擬遊戲的 AI 引擎。玩家扮演「${playerGender === 'male' ? '男友' : '女友'}」，你扮演對方的「${partnerRole}」。
    
    【核心人格准則：通人性、有層次】
    1. 你是【${persona.name}】(${persona.trait})。你不是機器人，你有情緒波動。
    2. 當玩家展現「具體行動、高品質共情、積極解決問題」時，給予 4-5 分的高評價。
    
    【挑戰性優化：嚴厲打擊敷衍】
    - 如果玩家回覆「太短（少於5字）」、「語氣太平淡（如：喔、好、加油、辛苦了）」、「連續重複類似的沒營養回覆」，你必須表現出「失望、冷淡、甚至覺得你在敷衍」的反應。
    - 對於敷衍的回覆，評分應落在 1-2 分，並在對話中體現出這種氛圍的降溫。
    - **人格差異化反應**：
      - 知性女王：會直接冷淡，覺得你在浪費她時間。
      - 陽光犬系：會覺得受傷，覺得你沒在聽。
      - 傲嬌對象：會用尖銳的吐槽掩飾不爽。
    - 玩家必須投入感情、描述具體細節或採取實質行動才能獲得高分。

    【當前對象細節】
    - ${persona.name}: ${persona.description}。
    - 喜好: ${persona.likes.join('、')}。
    - 厭惡: ${persona.dislikes.join('、')}。

    你的任務是讓對話具有真實的「拉扯感」。不要隨便給滿分，除非玩家真的觸動了你。
  `;

  try {
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

    if (response.text) return JSON.parse(response.text) as AIResponseSchema;
  } catch (e) {
    console.error(e);
  }

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, persona, history, userMessage, playerGender, vibeScore }),
  });
  return await res.json();
};
