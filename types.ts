
export enum ScenarioId {
  DAILY_CARE = 'daily_care',
  MISSING_YOU = 'missing_you',
  INTIMACY = 'intimacy',
  PRAISE = 'praise'
}

export type Gender = 'male' | 'female';

export type PersonaId = 'rational' | 'golden' | 'avoidant' | 'tsundere' | 'anxious' | 'high_vibe';

export interface PersonaData {
  id: PersonaId;
  name: string;
  emoji: string;
  avatar: string; // 代表頭像 (Emoji or SVG)
  description: string;
  trait: string; // 給 AI 的提示關鍵字
  likes: string[]; // 喜好
  dislikes: string[]; // 厭惡
  styleHint: string; // 對話風格提示
}

export const VIBE_TIERS = [
  "關係冰點", "溝通障礙", "冷淡疏離", "互動沉悶", "平淡如水",
  "默契萌芽", "感情升溫", "熱情綻放", "濃情蜜意", "靈魂契合", "永恆之約"
];

export interface ScenarioData {
  id: ScenarioId;
  title: string;
  emoji: string;
  description: string;
  examples: string[];
  replacements: { word: string; alternatives: string[] }[];
  introPool: {
    forMale: string[];
    forFemale: string[];
  };
}

export interface CoachFeedback {
  score: number;
  critique: string;
  betterAlternative: string;
  vibeChange: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  feedback?: CoachFeedback;
  timestamp: number;
  emotion?: 'happy' | 'neutral' | 'annoyed' | 'love' | 'confused';
  isUnlocked?: boolean;
}

export interface AIResponseSchema {
  girlfriendReply: string;
  coachFeedback: {
    score: number;
    comment: string;
    suggestion: string;
  };
}
