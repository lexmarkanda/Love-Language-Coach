export enum ScenarioId {
  DAILY_CARE = 'daily_care',
  MISSING_YOU = 'missing_you',
  INTIMACY = 'intimacy',
  PRAISE = 'praise'
}

export interface ScenarioData {
  id: ScenarioId;
  title: string;
  emoji: string;
  description: string;
  examples: string[];
  replacements: { word: string; alternatives: string[] }[];
  introMessage: string; // What the AI "girlfriend" says to start the chat
}

export interface CoachFeedback {
  score: number; // 1-5
  critique: string;
  betterAlternative: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  feedback?: CoachFeedback; // Only present if sender is 'user' (AI analyzes user) or attached to AI response about previous user msg
  timestamp: number;
}

export interface AIResponseSchema {
  girlfriendReply: string;
  coachFeedback: {
    score: number;
    comment: string;
    suggestion: string;
  };
}