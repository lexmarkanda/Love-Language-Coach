
import React, { useState, useEffect, useRef } from 'react';
import { ScenarioData, PersonaData, ChatMessage, Gender, VIBE_TIERS } from '../types';
import { generateReplyAndFeedback } from '../services/geminiService';
import { SARCASM_QUOTES, PLAYER_TYPES } from '../constants';

interface ChatInterfaceProps {
  scenario: ScenarioData;
  persona: PersonaData;
  playerGender: Gender;
  onExit: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ scenario, persona, playerGender, onExit }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [vibeScore, setVibeScore] = useState(50);
  const [lastScoreChange, setLastScoreChange] = useState<number | null>(null);
  const [showSuggestionId, setShowSuggestionId] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<'playing' | 'won' | 'lost'>('playing');
  const [isMinimized, setIsMinimized] = useState(false);
  const [sarcasmQuote, setSarcasmQuote] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPersonaInfo, setShowPersonaInfo] = useState(false);
  const [showTierInfo, setShowTierInfo] = useState(false);
  const [activeEmojiId, setActiveEmojiId] = useState<string | null>(null);
  const [showFinalCall, setShowFinalCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const FEEDBACK_COST = 5;

  const restartGame = () => {
    setVibeScore(50);
    setGameResult('playing');
    setIsMinimized(false);
    setShowFinalCall(false);
    setLastScoreChange(null);
    setShowSuggestionId(null);
    
    const pool = playerGender === 'male' ? scenario.introPool.forMale : scenario.introPool.forFemale;
    const randomIntro = pool[Math.floor(Math.random() * pool.length)];
    const initMsgId = 'init-' + Date.now();
    setMessages([{
      id: initMsgId,
      sender: 'ai',
      text: randomIntro,
      timestamp: Date.now(),
      emotion: 'neutral'
    }]);
  };

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('vibe_tutorial_seen');
    if (!hasSeenTutorial) setShowTutorial(true);

    const pool = playerGender === 'male' ? scenario.introPool.forMale : scenario.introPool.forFemale;
    const randomIntro = pool[Math.floor(Math.random() * pool.length)];
    const initMsgId = 'init-' + Date.now();
    setMessages([{
      id: initMsgId,
      sender: 'ai',
      text: randomIntro,
      timestamp: Date.now(),
      emotion: 'neutral'
    }]);
  }, [scenario, playerGender]);

  useEffect(() => {
    if (gameResult === 'playing') {
      if (vibeScore >= 100) {
        setShowFinalCall(true);
      } else if (vibeScore <= 0) {
        setSarcasmQuote(SARCASM_QUOTES[Math.floor(Math.random() * SARCASM_QUOTES.length)]);
        setShowFinalCall(true);
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, vibeScore, gameResult]);

  const getVibeTier = (score: number) => {
    const index = Math.min(VIBE_TIERS.length - 1, Math.floor(score / 10));
    return VIBE_TIERS[index];
  };

  const getEmojiForEmotion = (emotion: string) => {
    switch (emotion) {
      case 'love': return '🥰';
      case 'happy': return '✨';
      case 'annoyed': return '💢';
      case 'confused': return '❓';
      default: return '💬';
    }
  };

  const getBarStyles = () => {
    if (vibeScore <= 20) return 'from-red-600 to-rose-700 animate-pulse-fast shadow-[0_0_15px_rgba(220,38,38,0.7)]';
    if (vibeScore > 85) return 'from-rose-400 via-pink-500 to-purple-600 animate-fire shadow-[0_0_20px_rgba(244,63,94,0.6)]';
    return 'from-emerald-400 to-cyan-500 animate-bounce-subtle';
  };

  const handleSend = async () => {
    if (!input.trim() || gameResult !== 'playing' || showFinalCall) return;

    const userMsgText = input;
    const userMsgId = 'u-' + Date.now();
    setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: userMsgText, timestamp: Date.now(), isUnlocked: false, isSuggestionUnlocked: false }]);
    setInput('');
    setIsTyping(true);
    setLastScoreChange(null);

    const history = messages.map(m => ({
      role: m.sender === 'user' ? 'user' as const : 'model' as const,
      content: m.text
    }));

    try {
      const response = await generateReplyAndFeedback(scenario, persona, history, userMsgText, playerGender, vibeScore);
      const score = response.coachFeedback.score;
      let change = 0;
      if (score === 5) change = 10;
      else if (score === 4) change = 5;
      else if (score === 3) change = 0;
      else if (score === 2) change = -12;
      else if (score === 1) change = -25;
      
      setLastScoreChange(change);
      setVibeScore(prev => Math.max(0, Math.min(100, prev + change)));
      setIsTyping(false);

      const aiMsgId = 'ai-' + Date.now();
      const emotion = score >= 5 ? 'love' : score >= 4 ? 'happy' : score <= 2 ? (score === 1 ? 'annoyed' : 'confused') : 'neutral';

      setMessages(prev => prev.map(m => m.id === userMsgId ? {
        ...m,
        feedback: { 
          score: response.coachFeedback.score, 
          critique: response.coachFeedback.comment, 
          betterAlternative: response.coachFeedback.suggestion, 
          vibeChange: change 
        }
      } : m));

      setMessages(prev => [...prev, {
        id: aiMsgId,
        sender: 'ai',
        text: response.girlfriendReply,
        timestamp: Date.now(),
        emotion: emotion as any
      }]);

      setActiveEmojiId(aiMsgId);
      setTimeout(() => setActiveEmojiId(null), 3000);
    } catch (e) { setIsTyping(false); }
  };

  const handleUnlockFeedback = (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || msg.isUnlocked || !msg.feedback || vibeScore < FEEDBACK_COST) return;
    setVibeScore(prev => prev - FEEDBACK_COST);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isUnlocked: true } : m));
  };

  const getUnlockCost = () => {
    if (vibeScore > 60) return 5;
    if (vibeScore < 10) return 0;
    return 2;
  };

  const handleUnlockSuggestion = (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !msg.feedback) return;

    // 如果已經解鎖，只切換顯示
    if (msg.isSuggestionUnlocked) {
      setShowSuggestionId(showSuggestionId === msgId ? null : msgId);
      return;
    }

    const cost = getUnlockCost();
    if (vibeScore < cost) {
      alert("HP 不足，無法獲得神助攻建議！");
      return;
    }

    setVibeScore(prev => Math.max(0, prev - cost));
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isSuggestionUnlocked: true } : m));
    setShowSuggestionId(msgId);
  };

  const getUnlockCostLabel = () => {
    const cost = getUnlockCost();
    if (cost === 0) return 'FREE';
    return `Cost ${cost} HP`;
  };

  const stats = (() => {
    const userMsgs = messages.filter(m => m.sender === 'user' && m.feedback);
    if (userMsgs.length === 0) return [50, 50, 50, 50, 50];
    const avgScore = userMsgs.reduce((acc, m) => acc + (m.feedback?.score || 0), 0) / userMsgs.length;
    return [Math.min(100, avgScore * 20 + 10), 60, 70, 50, Math.min(100, vibeScore)];
  })();

  const playerAnalysis = PLAYER_TYPES[Math.floor((vibeScore / 101) * PLAYER_TYPES.length)];

  return (
    <div className="flex flex-col h-full bg-slate-50 relative font-sans overflow-hidden">
      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="absolute inset-0 z-[1000] bg-slate-900/95 flex flex-col items-center justify-center p-8 animate-fade-in backdrop-blur-md">
          <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-10 shadow-2xl max-w-sm transform -rotate-1">
             <div className="text-5xl mb-6 text-center">💡</div>
             <h3 className="text-2xl font-black text-slate-900 mb-4 text-center">玩法核心</h3>
             <ul className="space-y-4 text-slate-700 font-bold mb-8 text-sm">
               <li className="flex gap-3">
                 <span className="bg-rose-100 text-rose-500 rounded-full w-6 h-6 flex items-center justify-center text-[10px] flex-shrink-0">1</span>
                 <span>維持好感度 HP，<span className="text-emerald-500 underline font-black">達到 100 通關成功</span>，<span className="text-rose-500 underline font-black">降至 0 則特訓失敗</span>。</span>
               </li>
               <li className="flex gap-3">
                 <span className="bg-rose-100 text-rose-500 rounded-full w-6 h-6 flex items-center justify-center text-[10px] flex-shrink-0">2</span>
                 <span>點擊對話框左側的 <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded-full text-[8px]">H</span> 小圓圈，可以<span className="text-rose-400 italic">解鎖 AI 大師的點評建議</span>。</span>
               </li>
               <li className="flex gap-3">
                 <span className="bg-rose-100 text-rose-500 rounded-full w-6 h-6 flex items-center justify-center text-[10px] flex-shrink-0">3</span>
                 <span>每次解鎖建議會消耗 <span className="text-rose-500 font-black">5 HP</span>，請謹慎使用。</span>
               </li>
             </ul>
             <button onClick={() => { setShowTutorial(false); localStorage.setItem('vibe_tutorial_seen', 'true'); }} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-black transition-all shadow-lg active:scale-95">
               知道了，開始挑戰!
             </button>
          </div>
        </div>
      )}

      {/* Info Modals */}
      {showPersonaInfo && (
        <div className="fixed inset-0 z-[800] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowPersonaInfo(false)}>
          <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-8 w-full max-w-xs animate-pop-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="text-7xl mb-4">{persona.avatar}</div>
              <h3 className="text-2xl font-black text-slate-900">{persona.name}</h3>
              <p className="text-slate-500 text-sm font-bold italic mt-1">{persona.styleHint}</p>
            </div>
            <div className="space-y-4">
              <div className="bg-emerald-50 border-2 border-emerald-100 p-4 rounded-2xl">
                <span className="text-[10px] font-black text-emerald-600 uppercase mb-1 block">對象喜好</span>
                <p className="text-emerald-900 text-sm font-bold">{persona.likes.join('、')}</p>
              </div>
              <div className="bg-rose-50 border-2 border-rose-100 p-4 rounded-2xl">
                <span className="text-[10px] font-black text-rose-600 uppercase mb-1 block">對話雷區</span>
                <p className="text-rose-900 text-sm font-bold">{persona.dislikes.join('、')}</p>
              </div>
            </div>
            <button onClick={() => setShowPersonaInfo(false)} className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-black text-sm uppercase active:scale-95">關閉</button>
          </div>
        </div>
      )}

      {showTierInfo && (
        <div className="fixed inset-0 z-[800] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowTierInfo(false)}>
          <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-6 w-full max-w-xs animate-pop-in max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-900 mb-6 text-center italic">關係進程表</h3>
            <div className="space-y-3">
              {[...VIBE_TIERS].reverse().map((tier, i) => {
                const isActive = getVibeTier(vibeScore) === tier;
                return (
                  <div key={tier} className={`flex items-center gap-4 p-3 rounded-2xl border-2 transition-all ${isActive ? 'border-rose-500 bg-rose-50 scale-105 shadow-md' : 'border-slate-100 opacity-60'}`}>
                    <span className="text-[10px] font-black text-slate-400">Lv.{(VIBE_TIERS.length - 1 - i)}</span>
                    <span className={`font-black text-sm ${isActive ? 'text-rose-600' : 'text-slate-700'}`}>{tier}</span>
                    {isActive && <span className="ml-auto animate-pulse">🎯</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Final Call Banner */}
      {showFinalCall && (
        <div className="absolute inset-0 z-[900] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-8 animate-fade-in">
          <div className="bg-white border-4 border-slate-900 rounded-[3rem] p-10 shadow-2xl max-w-sm text-center transform scale-105">
            <div className="text-7xl mb-4 animate-bounce">{vibeScore >= 100 ? '💖' : '💔'}</div>
            <h3 className="text-3xl font-black text-slate-900 mb-4">{vibeScore >= 100 ? '恭喜通關！' : '特訓結束'}</h3>
            <p className="text-slate-500 font-bold mb-8 leading-relaxed">
              {vibeScore >= 100 ? '你們的靈魂已達成深度契合！' : '這段關係似乎遇到了嚴峻的挑戰...'}
            </p>
            <button 
              onClick={() => { setGameResult(vibeScore >= 100 ? 'won' : 'lost'); setShowFinalCall(false); }}
              className="w-full bg-rose-500 text-white py-5 rounded-2xl font-black hover:bg-rose-600 transition-all shadow-xl active:scale-95 text-xl uppercase"
            >
              點擊查看攻略結果 →
            </button>
          </div>
        </div>
      )}

      {/* Header HUD */}
      <div className="bg-white px-5 py-6 border-b-4 border-slate-900 sticky top-0 z-[50] shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <div className="flex flex-col cursor-pointer active:scale-95 transition-transform" onClick={() => setShowPersonaInfo(true)}>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Profile • {scenario.title}</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl sm:text-4xl">{persona.avatar}</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter">{persona.name} <span className="text-rose-500">+</span></span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTutorial(true)} className="w-10 h-10 flex items-center justify-center bg-amber-50 rounded-2xl border-2 border-amber-200 text-amber-500 active:scale-90">💡</button>
            <button onClick={onExit} className="bg-slate-100 text-slate-500 text-[10px] font-black px-4 py-2 rounded-2xl border-2 border-slate-200 uppercase active:scale-90">Quit</button>
          </div>
        </div>

        <div className="relative">
          <div className="flex justify-between items-end mb-3 px-1 cursor-pointer" onClick={() => setShowTierInfo(true)}>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-black text-slate-900 italic">HP</span>
              <span className={`text-4xl sm:text-5xl font-black italic tracking-tighter transition-all ${vibeScore < 30 ? 'text-red-700 animate-shake-soft' : vibeScore > 85 ? 'text-rose-600 animate-bounce-slow' : 'text-slate-900'}`}>
                {vibeScore} <span className="text-base text-slate-400">/ 100</span>
              </span>
              <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full ml-2 shadow-sm uppercase">{getVibeTier(vibeScore)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-12 bg-slate-200 rounded-full p-1.5 shadow-inner border-4 border-slate-900 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${getBarStyles()}`} style={{ width: `${vibeScore}%` }} />
            </div>
            <span className={`text-4xl ${vibeScore < 30 ? 'grayscale brightness-50' : vibeScore > 85 ? 'animate-heart-beat shadow-rose-400' : ''}`}>
              {vibeScore > 85 ? '🔥' : vibeScore < 30 ? '💔' : '💖'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center py-2 border-b-2 border-slate-200/50">
        Objective: {scenario.title}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-12 pb-44 scrollbar-hide bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-14 h-14 rounded-full bg-white flex items-center justify-center border-4 shadow-xl flex-shrink-0 relative transition-transform duration-500 ${
              msg.sender === 'ai' && msg.emotion === 'love' ? 'border-rose-400 scale-110' : 'border-slate-900'
            }`}>
              <span className="text-3xl">{msg.sender === 'user' ? (playerGender === 'male' ? '🙋‍♂️' : '🙋‍♀️') : persona.avatar}</span>
              {activeEmojiId === msg.id && (
                <div className="absolute -top-6 -right-6 text-4xl animate-float-fade-stay z-20">
                  {getEmojiForEmotion(msg.emotion || 'neutral')}
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-3 max-w-[80%] relative">
              {msg.sender === 'user' && !msg.isUnlocked && msg.feedback && (
                <button 
                  onClick={() => handleUnlockFeedback(msg.id)}
                  className="absolute left-[-45px] top-2 w-9 h-9 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-black shadow-2xl animate-pulse ring-4 ring-rose-100 transition-all active:scale-75 z-10"
                >
                  H
                </button>
              )}

              <div className={`rounded-[2rem] px-6 py-5 text-base sm:text-lg leading-relaxed shadow-xl font-bold border-2 transition-all ${
                msg.sender === 'user' ? 'bg-slate-900 text-white border-slate-900 rounded-tr-none' : 'bg-white text-slate-800 border-slate-100 rounded-tl-none'
              }`}>
                {msg.text}
              </div>

              {msg.sender === 'user' && msg.feedback && msg.isUnlocked && (
                <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-7 shadow-2xl transform -rotate-1 animate-pop-in mt-3 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 px-5 py-2 rounded-bl-3xl font-black text-xs text-white italic ${
                    msg.feedback.score >= 4 ? 'bg-emerald-500' : msg.feedback.score <= 2 ? 'bg-rose-600' : 'bg-slate-900'
                  }`}>SCORE: {msg.feedback.score}/5</div>
                  <div className="flex flex-col mb-5 border-b-4 border-slate-900 pb-5">
                    <span className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-3">
                      {msg.feedback.score >= 5 ? '🔥 CRITICAL!' : msg.feedback.score >= 4 ? '🎯 NICE!' : msg.feedback.score <= 2 ? '❄️ MISFIRE!' : '☄️ HIT!'}
                    </span>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-4 h-4 rounded-full border-2 border-slate-900 ${i <= (msg.feedback?.score || 0) ? 'bg-rose-500' : ''}`} />)}
                      </div>
                      <span className={`text-4xl font-black italic ${msg.feedback.vibeChange > 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                         {msg.feedback.vibeChange > 0 ? `+${msg.feedback.vibeChange}` : msg.feedback.vibeChange}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <p className="text-slate-800 text-sm sm:text-base font-black leading-relaxed">{msg.feedback.critique}</p>
                    <div className="pt-2">
                      <button 
                        onClick={() => handleUnlockSuggestion(msg.id)} 
                        className={`flex items-center gap-3 font-black text-[10px] uppercase transition-all px-6 py-2.5 rounded-full border-2 ${showSuggestionId === msg.id ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-rose-500 border-rose-100'}`}
                      >
                        <span>{showSuggestionId === msg.id ? '−' : '＋'}</span> 獲助攻建議 
                        <span className="ml-1 opacity-60">
                          ({msg.isSuggestionUnlocked ? 'UNLOCKED' : getUnlockCostLabel()})
                        </span>
                      </button>
                      {showSuggestionId === msg.id && (
                        <div className="mt-4 bg-rose-50 p-6 rounded-[2rem] border-2 border-rose-200 animate-fade-in shadow-inner">
                          <p className="text-rose-900 italic text-sm sm:text-base font-black leading-relaxed">「{msg.feedback.betterAlternative}」</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-3 p-6 bg-white/80 w-fit rounded-full ml-16 border-2 border-slate-100 shadow-lg">
             <div className="w-2.5 h-2.5 bg-rose-400 rounded-full animate-bounce"></div>
             <div className="w-2.5 h-2.5 bg-rose-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
             <div className="w-2.5 h-2.5 bg-rose-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent z-[60]">
        <div className="flex gap-4 items-end max-w-lg mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={gameResult !== 'playing' || showFinalCall}
            placeholder={vibeScore <= 0 ? "特訓終了..." : vibeScore >= 100 ? "攻略大成功！" : "輸入你的策略對話..."}
            className="flex-1 bg-white border-4 border-slate-900 rounded-[2rem] px-7 py-5 focus:ring-4 focus:ring-rose-100 transition-all resize-none shadow-2xl text-lg font-bold max-h-40 placeholder:text-slate-300"
            rows={1}
          />
          <button 
            onClick={handleSend} 
            disabled={isTyping || !input.trim() || gameResult !== 'playing' || showFinalCall} 
            className="bg-slate-900 text-white w-16 h-16 rounded-[1.5rem] shadow-2xl flex items-center justify-center border-b-8 border-slate-700 active:border-b-0 active:translate-y-2 transition-all flex-shrink-0 disabled:bg-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>
          </button>
        </div>
      </div>

      {/* Game Result Modal */}
      {gameResult !== 'playing' && !isMinimized && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-lg flex flex-col items-center justify-center p-6 animate-fade-in overflow-y-auto">
          <button 
            onClick={() => setIsMinimized(true)} 
            className="fixed top-8 right-8 z-[1200] w-14 h-14 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white border-4 border-white/30 transition-all active:scale-90 shadow-2xl backdrop-blur-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="text-center py-12 w-full max-w-lg">
            <div className="text-9xl mb-6 drop-shadow-2xl">{gameResult === 'won' ? '🏆' : '💀'}</div>
            <h2 className="text-6xl sm:text-7xl font-black text-white italic tracking-tighter mb-4 uppercase">
              {gameResult === 'won' ? 'Victory' : 'Game Over'}
            </h2>
            <div className="bg-white/15 border-4 border-white/25 rounded-[3.5rem] p-8 mb-12 backdrop-blur-xl max-w-sm mx-auto shadow-2xl">
              <h3 className="text-xs font-black text-rose-300 uppercase tracking-[0.4em] mb-10">對話風格戰鬥力 / Analysis</h3>
              <div className="flex justify-center mb-10">
                <svg width="200" height="200" viewBox="0 0 200 200" className="overflow-visible">
                  {[20, 40, 60, 80, 100].map(r => (
                    <polygon key={r} points={Array.from({ length: 5 }).map((_, i) => `${100 + (r * 0.8) * Math.sin(i * Math.PI * 2 / 5)},${100 - (r * 0.8) * Math.cos(i * Math.PI * 2 / 5)}`).join(' ')} className="fill-none stroke-white/20" />
                  ))}
                  <polygon points={stats.map((v, i) => `${100 + (v * 0.8) * Math.sin(i * Math.PI * 2 / 5)},${100 - (v * 0.8) * Math.cos(i * Math.PI * 2 / 5)}`).join(' ')} className="fill-rose-500/40 stroke-rose-500 stroke-[3]" />
                </svg>
              </div>
              <div className="bg-white rounded-[2.5rem] p-6 text-slate-900 shadow-2xl text-left transform rotate-1 border-4 border-slate-900">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{playerAnalysis.emoji}</span>
                  <span className="text-xl font-black tracking-tight">{playerAnalysis.name}</span>
                </div>
                <p className="text-xs font-bold text-slate-500 leading-relaxed mb-4">{playerAnalysis.desc}</p>
                <div className="border-t-2 border-slate-100 pt-3">
                   <p className="text-[10px] font-black text-rose-500 uppercase mb-1">大師特訓建議</p>
                   <p className="text-xs font-black leading-relaxed">{playerAnalysis.suggest}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
              <button onClick={() => { setMessages(prev => prev.map(m => m.sender === 'user' && m.feedback ? { ...m, isUnlocked: true } : m)); setIsMinimized(true); }} className="bg-white text-slate-900 font-black py-5 rounded-3xl hover:bg-slate-100 transition-all text-lg uppercase shadow-2xl">展開歷史紀錄回饋</button>
              <div className="flex gap-4">
                <button onClick={restartGame} className="flex-1 bg-rose-500 text-white font-black py-5 rounded-3xl hover:bg-rose-600 transition-all text-lg shadow-2xl">再戰一局</button>
                <button onClick={() => alert("功能開發中！可長按螢幕截圖分享結果喔！📸")} className="flex-1 bg-sky-500 text-white font-black py-5 rounded-3xl hover:bg-sky-600 transition-all text-lg shadow-2xl">分享成果</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMinimized && (
        <div className="absolute top-[210px] right-4 z-[90] animate-bounce">
          <button onClick={() => setIsMinimized(false)} className="bg-rose-500 text-white px-4 py-2 rounded-full font-black text-xs shadow-2xl border-2 border-white flex items-center gap-2 active:scale-90 transition-transform">
            <span>返回結算畫面</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" /></svg>
          </button>
        </div>
      )}

      <style>{`
        @keyframes fire { 0%, 100% { filter: brightness(1) saturate(1.2); } 50% { filter: brightness(1.6) saturate(1.8) contrast(1.2); } }
        .animate-fire { animation: fire 0.6s infinite alternate; }
        @keyframes heart-beat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); } }
        .animate-heart-beat { animation: heart-beat 0.5s infinite; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-bounce-slow { animation: bounce-slow 1s infinite; }
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        .animate-bounce-subtle { animation: bounce-subtle 0.8s infinite; }
        @keyframes pulse-fast { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.8; } }
        .animate-pulse-fast { animation: pulse-fast 0.4s infinite; }
        @keyframes shake-soft { 0%, 100% { transform: translate(0); } 25% { transform: translate(1px, -1px); } 75% { transform: translate(-1px, 1px); } }
        .animate-shake-soft { animation: shake-soft 0.2s infinite; }
        @keyframes float-fade-stay {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          15% { transform: translateY(-30px) scale(1.4); opacity: 1; }
          85% { transform: translateY(-40px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-50px) scale(1); opacity: 0; }
        }
        .animate-float-fade-stay { animation: float-fade-stay 3s ease-in-out forwards; }
        .animate-pop-in { animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default ChatInterface;
