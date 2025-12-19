import { ScenarioId, ScenarioData } from './types';

export const SCENARIOS: Record<ScenarioId, ScenarioData> = {
  [ScenarioId.DAILY_CARE]: {
    id: ScenarioId.DAILY_CARE,
    title: '日常關心',
    emoji: '🍵',
    description: '避免例行公事般的問候，展現真正的體貼。',
    introMessage: '剛回到家，覺得今天好累喔...',
    examples: [
      '下班了嗎？今天辛苦了吧？',
      '你今天工作順利嗎？我一直在想你',
      '今天過得還好嗎？我好想聽你說說話',
      '吃飯了嗎？想不想一起線上吃點小東西',
      '忙碌了一整天，記得照顧自己喔～'
    ],
    replacements: [
      { word: '辛苦', alternatives: ['勞累', '累壞了', '忙碌了一整天'] },
      { word: '順利', alternatives: ['順心', '順順的', '一切安好'] },
      { word: '照顧自己', alternatives: ['保重', '愛護自己', '別太累'] }
    ]
  },
  [ScenarioId.MISSING_YOU]: {
    id: ScenarioId.MISSING_YOU,
    title: '想念',
    emoji: '🌙',
    description: '超越「好想你」，描述具體的思念感受。',
    introMessage: '剛剛看到路邊一對情侶牽手，突然好想你。',
    examples: [
      '一整天都想見到你，感覺空蕩蕩的',
      '想聽你的聲音，想知道你在做什麼',
      '想抱著你入睡，感受你的溫度',
      '想和你分享今天的小事，因為只有你最懂我',
      '好想你，你的笑容一直在我的腦海裡打轉'
    ],
    replacements: [
      { word: '想', alternatives: ['渴望', '掛念', '思念', '心心念念'] },
      { word: '抱著', alternatives: ['緊抱', '擁抱', '偎依', '攬著'] },
      { word: '小事', alternatives: ['一點小趣事', '趣聞', '日常點滴'] }
    ]
  },
  [ScenarioId.INTIMACY]: {
    id: ScenarioId.INTIMACY,
    title: '親密互動',
    emoji: '💋',
    description: '用文字傳遞溫度與觸感，增加臉紅心跳感。',
    introMessage: '如果現在我在你身邊，你會想做什麼？',
    examples: [
      '想親親你，感受你的溫暖',
      '好想黏著你，感受你在我身邊的氣息',
      '好想抱緊你，聞著你的味道，那讓我好安心',
      '想和你親密依偎，感覺心都融化了',
      '想和你偷甜蜜的小親親，看你害羞的樣子'
    ],
    replacements: [
      { word: '黏著', alternatives: ['靠近', '偎依', '緊緊擁抱', '賴在你身上'] },
      { word: '心都融化', alternatives: ['心癢癢', '幸福滿滿', '暖暖的', '酥酥麻麻'] },
      { word: '小親親', alternatives: ['親嘴', '甜蜜吻', '輕吻', '熱吻'] }
    ]
  },
  [ScenarioId.PRAISE]: {
    id: ScenarioId.PRAISE,
    title: '讚美與肯定',
    emoji: '✨',
    description: '具體地稱讚細節，讓她感受到被重視。',
    introMessage: '我覺得最近自己好像變胖了，好沒自信...',
    examples: [
      '你真貼心，每次都讓我覺得幸福',
      '謝謝你一直在我身邊，你是我的力量來源',
      '你笑起來真的好迷人，看著你就覺得世界很美好',
      '愛你這樣的你，總是給我滿滿的安全感',
      '有你真好，我每天都因為有你而好開心'
    ],
    replacements: [
      { word: '貼心', alternatives: ['溫暖', '細心', '體貼', '善解人意'] },
      { word: '幸福', alternatives: ['快樂', '滿足', '心動', '無比幸運'] },
      { word: '迷人', alternatives: ['可愛', '魅力十足', '動人', '閃閃發光'] }
    ]
  }
};