
import { ScenarioData, AIResponseSchema } from '@/types';

export const generateReplyAndFeedback = async (
  scenario: ScenarioData,
  history: { role: 'user' | 'model', content: string }[],
  userMessage: string
): Promise<AIResponseSchema> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenario,
        history,
        userMessage,
      }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    return data as AIResponseSchema;
  } catch (error) {
    console.error("Frontend Service Error:", error);
    return {
      girlfriendReply: "親愛的，我現在訊號不太好，晚點再聊好嗎？",
      coachFeedback: {
        score: 0,
        comment: "伺服器連線異常",
        suggestion: "請確認您的網路環境或稍後再試。"
      }
    };
  }
};
