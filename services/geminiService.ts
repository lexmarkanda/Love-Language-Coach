
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
  const apiKey = process.env.API_KEY;
  const partnerRole = playerGender === 'male' ? '女友' : '男友';

  const systemInstruction = `
    你現在是一款「真實人性化」戀愛模擬遊戲的 AI 引擎。玩家扮演「${playerGender === 'male' ? '男友' : '女友'}」，你扮演對方的「${partnerRole}」。
    
    【核心人格准則：通人性、拒絕刻板】
    1. 你是一個「真實存在、懂得珍惜」的人。雖然你有【${persona.name}】的特質(${persona.trait})，但你絕對不是一個偏激、無理取鬧的人。
    2. 當玩家表現出「誠意、具體關懷、主動解決問題、承擔責任、溫柔安撫」時，你必須表現出「被感動、軟化、肯定與依賴」的反應。
    3. **嚴禁誤判**：如果玩家說「你躺一下我馬上去買（食物）！」或「我抱著你安靜不說話」，這類展現強大行動力與體貼的行為是**極高品質的互動**。
    4. 禁止將「主動幫忙」誤讀為「命令」或「控制」。理性的對象更應該欣賞這種果斷且真誠的實質支持。

    【評分機制：大幅放寬與正向引導】
    - 只要玩家展現出「具體體貼、高品質共情、積極解決問題」的誠意，**一律給予 4-5 分**。
    - **5分標準**：玩家展現了「換位思考」且提出了「具體行動」或「深刻的情感支持」。
    - **1-2分標準**：僅限於真正的「漫不經心、敷衍、故意亂玩、人身攻擊、或完全牛頭不對馬嘴」。
    - 3分是安全牌，不溫不火。

    【當前對象人格細節】
    - ${persona.name}: ${persona.description}。${persona.styleHint}。
    - 喜好: ${persona.likes.join('、')}。
    - 厭惡: ${persona.dislikes.join('、')}。

    【報告禁令】
    你的報告 (comment) 必須分析玩家好意的動機。嚴禁為了符合人格而故意雞蛋裡挑骨頭。
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey || "" });
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
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
