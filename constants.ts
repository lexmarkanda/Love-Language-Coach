
import { ScenarioId, ScenarioData, PersonaId, PersonaData } from './types';

export const SCENARIOS: Record<ScenarioId, ScenarioData> = {
  [ScenarioId.DAILY_CARE]: {
    id: ScenarioId.DAILY_CARE,
    title: '讀懂疲憊感',
    emoji: '🍵',
    description: '當對方說累的時候，除了「辛苦了」，你還能接住他的情緒嗎？',
    introPool: {
      forMale: [
        '剛回到家，覺得今天心好累喔...',
        '今天公司事情超多，我現在整個人都放空了。',
        '感覺最近壓力有點大，都睡不好 🥺',
        '如果可以現在原地消失就好了，真的好不想努力。',
        '肚子好餓喔，但累到連外送都不想點...'
      ],
      forFemale: [
        '剛開完會，頭快炸掉了。',
        '今天加班到現在才走，外面好冷。',
        '最近專案遇到一堆白痴，真的會氣死。',
        '好想趕快回家打電動，今天消耗太多能量了。',
        '雖然很累，但想到等等可以跟你說話就覺得還好。'
      ]
    },
    examples: ['我懂那種感覺，過來抱一個', '辛苦了，要不要我幫你點個甜的？', '今天真的辛苦了，你是最棒的'],
    replacements: [
      { word: '加油', alternatives: ['有我在', '慢慢來', '我陪你'] },
      { word: '辛苦了', alternatives: ['難為你了', '你好努力', '我看在眼裡'] }
    ]
  },
  [ScenarioId.MISSING_YOU]: {
    id: ScenarioId.MISSING_YOU,
    title: '連結感營造',
    emoji: '🌙',
    description: '拒絕無效的「想你」，試著描述具體的氛圍。',
    introPool: {
      forMale: [
        '剛剛路過我們上次去的那間店，突然好想你喔。',
        '你在幹嘛？我現在腦袋裡都是你的臉 🙈',
        '突然好想聽你的聲音，可以講一分鐘電話嗎？',
        '剛看完一部很感人的電影，好想你在身邊。',
        '我有有沒有說過，你笑起來的樣子真的很討厭（因為會害我分心）'
      ],
      forFemale: [
        '你在幹嘛？',
        '欸，我剛剛看到一個東西超像你的。',
        '突然覺得這世界沒你真無聊。',
        '今天天氣好到想把你綁架出來約會。',
        '沒事，只是想叫一下你的名字。'
      ]
    },
    examples: ['想你的味道了', '你在我腦子裡跑了一整天不累嗎？', '好想現在就飛到你身邊'],
    replacements: [
      { word: '想你', alternatives: ['掛念你', '腦子都是你', '心癢癢的'] }
    ]
  },
  [ScenarioId.INTIMACY]: {
    id: ScenarioId.INTIMACY,
    title: '升溫小惡魔',
    emoji: '💋',
    description: '適度的曖昧與拉扯，讓對話不再只是報備行程。',
    introPool: {
      forMale: [
        '你覺得...我們現在是什麼關係？',
        '如果我現在在你家門口，你會開門嗎？',
        '剛洗完澡，突然覺得床好大喔。',
        '你今天噴什麼香水？我身上好像還有你的味道。',
        '好想縮在你懷裡喔...（羞）'
      ],
      forFemale: [
        '你再這樣說，我真的會忍不住去找你。',
        '你很壞欸，每次都故意這樣撩。',
        '突然好想抱抱，那種很大力、很久的那種。',
        '你現在在想什麼？（壞笑）',
        '你今天穿那件襯衫真的...很帥。'
      ]
    },
    examples: ['過來，讓我親一下', '你的心跳聲好快', '我現在就想見到你'],
    replacements: [
      { word: '可愛', alternatives: ['犯規', '誘人', '想咬一口'] }
    ]
  },
  [ScenarioId.PRAISE]: {
    id: ScenarioId.PRAISE,
    title: '高情緒價值',
    emoji: '✨',
    description: '真誠的讚美是最高級的春藥，別再只會說「你好正/好帥」。',
    introPool: {
      forMale: [
        '我今天是不是穿得很奇怪啊？感覺沒什麼自信...',
        '你覺得我剪這個頭髮好看嗎？怕你不喜歡。',
        '最近變胖了，你是不是沒那麼愛我了？',
        '今天完成了一個大案子，但好像沒人發現。',
        '我真的覺得能遇到你是我這輩子最幸運的事。'
      ],
      forFemale: [
        '欸，我今天運動表現超好，快誇我！',
        '我有有沒有說過，你真的很懂我？',
        '你不覺得我們很有默契嗎？',
        '今天工作被稱讚了，第一個就想跟你說。',
        '你以後不准對別的女生這麼好。'
      ]
    },
    examples: ['你就是我的驕傲', '看著你我就覺得世界很美好', '沒人發現沒關係，你是我的寶藏'],
    replacements: [
      { word: '漂亮', alternatives: ['動人', '閃閃發光', '迷死人'] }
    ]
  }
};

export const MALE_PERSONAS: PersonaData[] = [
  { id: 'rational', name: '知性派', emoji: '🧐', avatar: '👨‍🏫', description: '務實沉穩，欣賞有效率且真誠的關懷。', trait: '重視邏輯與實踐、不愛花言巧語', likes: ['具體行動', '坦誠溝通'], dislikes: ['情緒勒索', '不著邊際'], styleHint: '平實穩重，只要感受到你的真心，會很可靠。' },
  { id: 'golden', name: '陽光犬系', emoji: '🐶', avatar: '👱‍♂️', description: '直球對決，熱情開朗且超級容易滿足。', trait: '積極、主動、高情緒價值', likes: ['讚美', '陪伴', '摸頭'], dislikes: ['冷戰', '被忽視'], styleHint: '充滿活力，非常容易被哄開心。' },
  { id: 'avoidant', name: '內斂避風港', emoji: '☁️', avatar: '🙍‍♂️', description: '不擅表達情緒，但內心渴望溫柔的陪伴。', trait: '安靜、慢熱', likes: ['舒適感', '無壓力陪伴'], dislikes: ['連環追問', '強行破冰'], styleHint: '字數較少，需要玩家細水長流。' },
  { id: 'tsundere', name: '傲嬌男孩', emoji: '😼', avatar: '🤵', description: '嘴上愛吐槽，其實很在意你。', trait: '嘴硬心軟', likes: ['被特殊對待', '偏愛'], dislikes: ['被敷衍', '太冷漠'], styleHint: '語氣彆別扭，但行為通常很體貼。' },
  { id: 'anxious', name: '細膩詩人', emoji: '🌊', avatar: '🎨', description: '心思細密，感性豐富，對關係很認真。', trait: '多愁善感、追求連結', likes: ['深層交流', '被堅定選擇'], dislikes: ['忽冷忽熱', '沒安全感'], styleHint: '情感充沛，回覆通常較長。' },
  { id: 'high_vibe', name: '魅力社交家', emoji: '🔥', avatar: '🤴', description: '自信風趣，喜歡聰明有趣的對話。', trait: '幽默、擅長拉扯', likes: ['有趣的話題', '挑戰性'], dislikes: ['無聊的報備', '死板'], styleHint: '語氣調皮，喜歡跟玩家開玩笑。' }
];

export const FEMALE_PERSONAS: PersonaData[] = [
  { id: 'rational', name: '知性女王', emoji: '👠', avatar: '👩‍💼', description: '獨立優秀，欣賞果斷且有擔當的實質支持。', trait: '理智、有主見、討厭廢話', likes: ['被理解', '實際行動'], dislikes: ['油嘴滑舌', '無端藉口'], styleHint: '優雅乾脆，對有擔當的行為會給予很高評價。' },
  { id: 'golden', name: '熱情貓系', emoji: '🐱', avatar: '👧', description: '愛撒嬌也愛熱鬧，感情直接而強烈。', trait: '開朗、感性、黏人', likes: ['被寵溺', '甜言蜜語', '小驚喜'], dislikes: ['被講道理', '孤單感'], styleHint: '活潑可愛，喜歡用表情符號。' },
  { id: 'avoidant', name: '透明系女孩', emoji: '🌫️', avatar: '👩‍🎨', description: '習慣安靜處理壓力，需要被溫柔接納。', trait: '內斂、不願麻煩他人', likes: ['安靜的關懷', '微小的默契'], dislikes: ['吵架', '強勢介入'], styleHint: '客氣但細膩，感受到安全感才會放鬆。' },
  { id: 'tsundere', name: '傲嬌大小姐', emoji: '🥀', avatar: '👸', description: '重視尊嚴，開心時會故意裝作沒感覺。', trait: '愛面子、說反話', likes: ['被哄', '儀式感', '偏愛'], dislikes: ['被忽視', '直男邏輯'], styleHint: '語氣強勢但隱含期待，需要玩家細心。' },
  { id: 'anxious', name: '感性小兔', emoji: '🧸', avatar: '👩‍💻', description: '情感需求度高，需要時刻感受你的存在。', trait: '缺乏安全感、需要連結', likes: ['穩定報備', '溫柔承諾'], dislikes: ['沈默', '不確定性'], styleHint: '黏稠的情緒感，需要大量安撫。' },
  { id: 'high_vibe', name: '活潑小太陽', emoji: '🌟', avatar: '💃', description: '充滿分享欲，喜歡愉快輕鬆的互動氛圍。', trait: '熱情、喜歡玩梗', likes: ['有趣的靈魂', '共同愛好'], dislikes: ['負能量', '沈悶無聊'], styleHint: '反應熱烈，期待玩家能跟上節奏。' }
];

export const SARCASM_QUOTES = [
  "你又一次憑實力把天給聊死了。",
  "你的情商大概還在月子中心進修。",
  "建議這段對話可以列入單身手冊反面教材。",
  "剛才那句話，是打算把對方推到外太空嗎？",
  "這種聊天法，連 Siri 都會想已讀不回。",
  "恭喜你，成功讓對方對你的人生關上了門。",
  "你是怎麼做到每一句都精準踩在雷區上的？",
  "空氣突然安靜，是因為你把氧氣聊乾了。",
  "對方目前對你的好感度，比昨天的剩菜還低。",
  "你這不是在聊天，你是在進行人道主義關懷（失敗版）。",
  "你的幽默感，似乎跟你的智商一起離家出走了。"
];

export const PLAYER_TYPES = [
  { emoji: "🏥", name: "療癒系暖護", trait: "高感性、高行動", desc: "你是那種能瞬間接住對方情緒的人。你的優點是讓人感到無比安全，缺點是偶爾會忽略自己的需求。", suggest: "保持溫柔的同時，也可以試著分享自己的脆弱。" },
  { emoji: "🤖", name: "鋼鐵運算者", trait: "高邏輯、低感性", desc: "你的對話像是一台精密機器，只生產解決方案。優點是可靠，缺點是冷冰冰。", suggest: "在給出建議前，先試著重複一次對方的情緒。" },
  { emoji: "🎭", name: "靈魂拉扯家", trait: "高幽默、高能量", desc: "你讓對話充滿驚喜與張力。優點是極具吸引力，缺點是讓人覺得不夠穩重。", suggest: "在關鍵時刻展現認真的一面，會讓你更有魅力。" },
  { emoji: "🕯️", name: "靜謐守望者", trait: "高耐心、穩重型", desc: "你是一個完美的聽眾。優點是情緒穩定，缺點是反應有時過於平淡。", suggest: "偶爾主動拋出話題，會讓對方感受到你的參與感。" },
  { emoji: "🛡️", name: "情緒避雷針", trait: "極高共感力", desc: "你天生就能避開對方的地雷。優點是互動流暢，缺點是顯得有些過於卑微。", suggest: "適度的自信與主見會讓你更有吸引力。" }
];
