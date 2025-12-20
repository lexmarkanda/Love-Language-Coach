
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const FEEDBACK_COST = 5;

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('vibe_tutorial_seen');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }

    const pool = playerGender === 'male' ? scenario.introPool.forMale : scenario.introPool.forFemale;
    const randomIntro = pool[Math.floor(Math.random() * pool.length)];
    setMessages([{
      id: 'init',
      sender: 'ai',
      text: randomIntro,
      timestamp: Date.now(),
      emotion: 'neutral'
    }]);
  }, [scenario, playerGender]);

  useEffect(() => {
    if (vibeScore >= 100 && gameResult === 'playing') {
      setGameResult('won');
      setIsMinimized(false);
    } else if (vibeScore <= 0 && gameResult === 'playing') {
      setGameResult('lost');
      setIsMinimized(false);
      setSarcasmQuote(SARCASM_QUOTES[Math.floor(Math.random() * SARCASM_QUOTES.length)]);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, vibeScore, gameResult]);

  const getVibeTier = (score: number) => {
    const index = Math.min(10, Math.floor(score / 10));
    return VIBE_TIERS[index];
  };

  const getEmotion = (score: number) => {
    if (score === 5) return 'love';
    if (score === 4) return 'happy';
    if (score === 3) return 'neutral';
    if (score === 2) return 'confused';
    return 'annoyed';
  };

  const getBarStyles = () => {
    if (vibeScore <= 20) return 'from-red-600 to-rose-700 animate-fire';
    if (vibeScore < 50) return 'from-orange-400 to-rose-500';
    if (vibeScore > 85) return 'from-rose-400 via-pink-500 to-purple-600 animate-fire shadow-[0_0_20px_rgba(244,63,94,0.5)]';
    return 'from-emerald-400 to-cyan-500';
  };

  const renderRatingIcons = (score: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full border-2 border-slate-900 ${
              i <= score 
                ? (score >= 4 ? 'bg-emerald-400' : score <= 2 ? 'bg-rose-500' : 'bg-amber-400') 
                : 'bg-transparent'
            }`}
          />
        ))}
      </div>
    );
  };

  const calculateStats = () => {
    const userMsgs = messages.filter(m => m.sender === 'user' && m.feedback);
    if (userMsgs.length === 0) return [50, 50, 50, 50, 50];
    const avgScore = userMsgs.reduce((acc, m) => acc + (m.feedback?.score || 0), 0) / userMsgs.length;
    const base = avgScore * 20;
    return [
      Math.min(100, base + (vibeScore / 4)), // 共感
      Math.min(100, 100 - base + 20), // 邏輯
      Math.min(100, base + 10), // 行動
      Math.min(100, (userMsgs.length * 10) + 30), // 幽默
      Math.min(100, vibeScore) // 耐心
    ];
  };

  const getPlayerAnalysis = (stats: number[]) => {
    if (stats[0] > 80 && stats[2] > 80) return PLAYER_TYPES[0];
    if (stats[1] > 70) return PLAYER_TYPES[1];
    if (stats[3] > 70) return PLAYER_TYPES[2];
    if (stats[4] > 80) return PLAYER_TYPES[3];
    return PLAYER_TYPES[4];
  };

  const handleSend = async () => {
    if (!input.trim() || gameResult !== 'playing') return;

    const userMsgText = input;
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: userMsgText, timestamp: Date.now(), isUnlocked: false }]);
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
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.girlfriendReply,
        timestamp: Date.now(),
        emotion: getEmotion(score)
      }]);
    } catch (e) { setIsTyping(false); }
  };

  const handleUnlockFeedback = (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || msg.isUnlocked || !msg.feedback || vibeScore < FEEDBACK_COST) return;
    setVibeScore(prev => prev - FEEDBACK_COST);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isUnlocked: true } : m));
  };

  const restartGame = () => {
    setMessages([]);
    setVibeScore(50);
    setGameResult('playing');
    setLastScoreChange(null);
    setIsMinimized(false);
    const pool = playerGender === 'male' ? scenario.introPool.forMale : scenario.introPool.forFemale;
    const randomIntro = pool[Math.floor(Math.random() * pool.length)];
    setMessages([{
      id: 'init',
      sender: 'ai',
      text: randomIntro,
      timestamp: Date.now(),
      emotion: 'neutral'
    }]);
  };

  const handleReview = () => {
    setMessages(prev => prev.map(m => m.sender === 'user' && m.feedback ? { ...m, isUnlocked: true } : m));
    setIsMinimized(true);
  };

  const stats = calculateStats();
  const playerAnalysis = getPlayerAnalysis(stats);

  const RadarChart = ({ values }: { values: number[] }) => {
    const size = 180;
    const center = size / 2;
    const radius = size * 0.4;
    const angleStep = (Math.PI * 2) / 5;
    const getPoint = (val: number, i: number) => {
      const r = (val / 100) * radius;
      const x = center + r * Math.sin(i * angleStep);
      const y = center - r * Math.cos(i * angleStep);
      return `${x},${y}`;
    };
    const points = values.map((v, i) => getPoint(v, i)).join(' ');
    const labels = ["共感", "邏輯", "行動", "幽默", "耐心"];
    return (
      <svg width={size} height={size} className="overflow-visible">
        {[20, 40, 60, 80, 100].map(r => (
          <polygon key={r} points={Array.from({ length: 5 }).map((_, i) => getPoint(r, i)).join(' ')} className="fill-none stroke-slate-200" />
        ))}
        <polygon points={points} className="fill-rose-500/30 stroke-rose-500 stroke-2" />
        {labels.map((l, i) => {
          const x = center + (radius + 20) * Math.sin(i * angleStep);
          const y = center - (radius + 20) * Math.cos(i * angleStep);
          return (
            <text key={l} x={x} y={y} textAnchor="middle" className="text-[10px] font-black fill-slate-400 uppercase tracking-tighter">{l}</text>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative font-sans overflow-hidden">
      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="absolute inset-0 z-[110] bg-slate-900/95 flex flex-col items-center justify-center p-8 animate-fade-in backdrop-blur-md">
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
                 <span>點擊你自己說過的對話框，可以<span className="text-rose-400 italic">解鎖 AI 大師的點評建議</span>。</span>
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
      {(showPersonaInfo || showTierInfo) && (
        <div className="absolute inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => { setShowPersonaInfo(false); setShowTierInfo(false); }}>
          <div className="bg-white border-4 border-slate-900 rounded-3xl p-8 w-full max-w-xs animate-pop-in overflow-y-auto max-h-[80vh]" onClick={e => e.stopPropagation()}>
            {showPersonaInfo ? (
              <>
                <div className="flex flex-col items-center text-center mb-6">
                  <span className="text-6xl mb-4">{persona.avatar}</span>
                  <h3 className="text-2xl font-black text-slate-900">{persona.name}</h3>
                  <p className="text-slate-500 text-sm font-bold mt-1 tracking-tight italic">{persona.styleHint}</p>
                </div>
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                    <span className="text-[10px] font-black text-emerald-600 uppercase block mb-1">對象喜好</span>
                    <p className="text-emerald-800 text-sm font-bold leading-tight">{persona.likes.join('、')}</p>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
                    <span className="text-[10px] font-black text-rose-600 uppercase block mb-1">對話雷區</span>
                    <p className="text-rose-800 text-sm font-bold leading-tight">{persona.dislikes.join('、')}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-black text-slate-900 mb-4 text-center">關係階級表</h3>
                <div className="space-y-2">
                  {[...VIBE_TIERS].reverse().map((tier, i) => (
                    <div key={tier} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${getVibeTier(vibeScore) === tier ? 'border-rose-500 bg-rose-50 shadow-md' : 'border-slate-100'}`}>
                      <span className="text-[10px] font-black text-slate-400">Lv.{(VIBE_TIERS.length - 1 - i)}</span>
                      <span className={`font-bold text-sm ${getVibeTier(vibeScore) === tier ? 'text-rose-600' : 'text-slate-700'}`}>{tier}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* RPG HUD */}
      <div className={`bg-white px-5 py-6 border-b-4 border-slate-900 sticky top-0 z-30 shadow-2xl transition-all duration-300 ${vibeScore < 30 && gameResult === 'playing' ? 'animate-vibrate-soft' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowPersonaInfo(true)}>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              TARGET PROFILE <span className="text-rose-500 font-black animate-pulse">+</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{persona.avatar}</span>
              <span className="text-xl font-black tracking-tighter text-slate-900">{persona.name}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTutorial(true)} className="w-9 h-9 flex items-center justify-center bg-amber-50 rounded-xl border border-amber-200 text-amber-500 hover:bg-amber-100 transition-colors">💡</button>
            <button onClick={onExit} className="bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-black px-3 py-2 rounded-xl transition-all border border-slate-200 uppercase tracking-tight active:scale-90">Quit</button>
          </div>
        </div>

        <div className="relative">
          <div className="flex justify-between items-end mb-2 px-1">
            <div className="flex items-baseline gap-2 cursor-pointer hover:opacity-80" onClick={() => setShowTierInfo(true)}>
              <span className="text-xs font-black text-slate-900 italic">HP</span>
              <span className={`text-4xl font-black italic tracking-tighter transition-all ${vibeScore < 30 ? 'text-red-700 animate-pulse-scale' : vibeScore > 85 ? 'text-rose-600' : 'text-slate-900'}`}>
                {vibeScore} <span className="text-base text-slate-400">/ 100</span>
              </span>
              <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full ml-2 shadow-sm uppercase tracking-tighter">{getVibeTier(vibeScore)}</span>
            </div>
            
            <div className={`flex flex-col items-end transition-all duration-500 ${lastScoreChange !== null ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
              <div className={`text-2xl font-black italic flex items-center gap-1 ${lastScoreChange && lastScoreChange > 0 ? 'text-emerald-500 animate-bounce-subtle' : 'text-rose-600 animate-shake-subtle'}`}>
                {lastScoreChange && lastScoreChange > 0 ? `+${lastScoreChange}` : lastScoreChange}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex-1 h-10 bg-slate-200 rounded-full p-1 shadow-inner border-4 border-slate-900 overflow-hidden relative">
              <div className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${getBarStyles()}`} style={{ width: `${vibeScore}%` }}>
                <div className={`w-full h-full animate-scan bg-gradient-to-r from-transparent via-white/60 to-transparent bg-[length:200%_100%] ${vibeScore > 85 ? 'opacity-90 blur-sm' : 'opacity-30'}`}></div>
              </div>
            </div>
            <div className={`relative transition-all duration-300 ${vibeScore > 85 ? 'scale-125' : 'scale-100'}`}>
              <span className={`text-4xl inline-block ${vibeScore < 30 ? 'animate-shake-heart grayscale brightness-50' : vibeScore > 85 ? 'animate-heart-beat-fast drop-shadow-[0_0_12px_rgba(244,63,94,1)]' : ''}`}>
                {vibeScore > 85 ? '🔥' : vibeScore < 30 ? '💔' : '💖'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Result Overlay */}
      {gameResult !== 'playing' && !isMinimized && (
        <div className="absolute inset-0 z-[100] bg-slate-900/65 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-fade-in overflow-y-auto">
          <button onClick={() => setIsMinimized(true)} className="fixed top-8 right-8 z-[110] w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white border-2 border-white/30 transition-all active:scale-90 shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="text-center transform animate-pop-in py-10 w-full max-w-lg">
            <div className="text-8xl mb-4">{gameResult === 'won' ? '🏆' : '💀'}</div>
            <h2 className="text-6xl font-black text-white italic tracking-tighter mb-2 uppercase drop-shadow-lg">
              {gameResult === 'won' ? 'Victory' : 'Game Over'}
            </h2>
            <p className="text-white font-bold mb-8 text-lg px-6 max-w-sm mx-auto leading-relaxed italic drop-shadow-md">
              {gameResult === 'won' ? '完美的溝通大師，你們的靈魂契合無比！' : sarcasmQuote}
            </p>

            <div className="bg-white/10 border-4 border-white/20 rounded-[3rem] p-8 mb-10 backdrop-blur-md max-w-xs mx-auto shadow-2xl">
              <h3 className="text-xs font-black text-rose-300 uppercase tracking-[0.3em] mb-6">對話風格戰鬥力 / Analysis</h3>
              <div className="flex justify-center mb-8"><RadarChart values={stats} /></div>
              <div className="text-left bg-white rounded-3xl p-6 text-slate-900 border-2 border-slate-900 shadow-xl transform rotate-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded font-black">TYPE</span>
                  <span className="text-lg font-black tracking-tight">{playerAnalysis.name}</span>
                </div>
                <p className="text-xs text-slate-500 font-bold mb-3">{playerAnalysis.desc}</p>
                <div className="border-t border-slate-100 pt-3">
                   <p className="text-[10px] font-black text-rose-500 uppercase mb-1">大師建議 / Suggestion</p>
                   <p className="text-xs font-bold leading-relaxed">{playerAnalysis.suggest}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
              <button onClick={handleReview} className="bg-white text-slate-900 font-black py-5 rounded-[1.5rem] hover:bg-slate-100 transition-all active:scale-95 shadow-2xl border-b-4 border-slate-300 text-lg uppercase">
                展開對話回饋
              </button>
              <div className="flex gap-3">
                <button onClick={restartGame} className="flex-1 bg-rose-500 text-white font-black py-5 rounded-[1.5rem] hover:bg-rose-600 transition-all active:scale-95 shadow-2xl border-b-4 border-rose-700 text-lg">再試一局</button>
                <button onClick={() => alert("功能開發中！截圖分享即將推出 📸")} className="flex-1 bg-sky-500 text-white font-black py-5 rounded-[1.5rem] hover:bg-sky-600 transition-all active:scale-95 shadow-2xl border-b-4 border-sky-700 text-lg">分享結果</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMinimized && (
        <div className="absolute top-[210px] right-4 z-[90] animate-bounce">
          <button onClick={() => setIsMinimized(false)} className="bg-rose-500 text-white px-4 py-2 rounded-full font-black text-xs shadow-2xl flex items-center gap-2 border-2 border-white ring-4 ring-rose-500/20 active:scale-90 transition-transform">
            <span>返回結算畫面</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" /></svg>
          </button>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-12 pb-40 scrollbar-hide bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center border-4 shadow-xl flex-shrink-0 transition-all duration-500 ${
              msg.sender === 'ai' && msg.emotion === 'love' ? 'border-rose-400 scale-110 shadow-rose-100' : 'border-slate-900'
            }`}>
              <span className="text-3xl">{msg.sender === 'user' ? (playerGender === 'male' ? '🙋‍♂️' : '🙋‍♀️') : persona.avatar}</span>
            </div>
            
            <div className="flex flex-col gap-3 max-w-[85%]">
              <div 
                onClick={() => msg.sender === 'user' && gameResult === 'playing' && handleUnlockFeedback(msg.id)}
                className={`rounded-3xl px-6 py-4 text-base leading-relaxed shadow-lg font-bold border-2 transition-all cursor-pointer group relative ${
                  msg.sender === 'user' ? 'bg-slate-900 text-white border-slate-900 rounded-tr-none hover:bg-slate-800' : 'bg-white text-slate-800 border-slate-100 rounded-tl-none'
                }`}
              >
                {msg.text}
                {msg.sender === 'user' && !msg.isUnlocked && msg.feedback && (
                  <div className="mt-1 flex justify-end">
                    <div className="bg-rose-500/10 group-hover:bg-rose-500/20 px-2 py-1 rounded-full flex items-center gap-1 transition-colors animate-pulse">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                      <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter opacity-70">Review</span>
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && msg.feedback && msg.isUnlocked && (
                <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-8 shadow-2xl transform -rotate-1 animate-pop-in mt-2 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 px-4 py-2 rounded-bl-2xl font-black text-[10px] text-white italic tracking-widest ${
                    msg.feedback.score >= 4 ? 'bg-emerald-500' : msg.feedback.score <= 2 ? 'bg-rose-600' : 'bg-slate-900'
                  }`}>QUALITY: {msg.feedback.score}/5</div>
                  <div className="flex flex-col mb-6 border-b-4 border-slate-900 pb-5">
                    <span className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-3">
                      {msg.feedback.score >= 5 ? '🔥 CRITICAL HIT!' : msg.feedback.score >= 4 ? '🎯 NICE HIT!' : msg.feedback.score <= 2 ? '❄️ MISFIRE!' : '☄️ HIT!'}
                    </span>
                    <div className="flex items-center justify-between">
                      {renderRatingIcons(msg.feedback.score)}
                      <div className="text-right">
                        <span className={`text-4xl font-black italic tracking-tighter ${msg.feedback.vibeChange > 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                           {msg.feedback.vibeChange > 0 ? `+${msg.feedback.vibeChange}` : msg.feedback.vibeChange}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <span className="text-xs font-black text-slate-400 uppercase mb-2 block tracking-[0.2em]">分析報告 / Analysis</span>
                      <p className="text-slate-800 text-base leading-relaxed font-bold">{msg.feedback.critique}</p>
                    </div>
                    <div className="pt-2">
                      <button onClick={() => setShowSuggestionId(showSuggestionId === msg.id ? null : msg.id)} className={`flex items-center gap-3 font-black text-xs uppercase transition-all px-6 py-2 rounded-full border-2 ${showSuggestionId === msg.id ? 'bg-rose-500 text-white border-rose-500 shadow-lg' : 'bg-white text-rose-500 border-rose-100 hover:border-rose-300'}`}>
                        <span>{showSuggestionId === msg.id ? '−' : '＋'}</span> 獲取神助攻建議
                      </button>
                      {showSuggestionId === msg.id && (
                        <div className="mt-4 bg-rose-50 p-6 rounded-3xl border-2 border-rose-200 animate-fade-in shadow-inner">
                          <p className="text-rose-800 italic text-base font-black leading-relaxed">「{msg.feedback.betterAlternative}」</p>
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
          <div className="flex items-center gap-2 p-5 bg-white/80 w-fit rounded-full ml-12 border-2 border-slate-100 shadow-xl">
             <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"></div>
             <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
             <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent z-40">
        <div className="flex gap-4 items-end max-w-lg mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={gameResult !== 'playing'}
            placeholder={gameResult === 'lost' ? "關係已結束..." : gameResult === 'won' ? "攻略成功！" : "輸入你的對話策略..."}
            className="flex-1 bg-white border-4 border-slate-900 rounded-[2rem] px-6 py-5 focus:ring-4 focus:ring-rose-100 transition-all resize-none shadow-2xl text-lg font-bold placeholder:text-slate-300 max-h-40"
            rows={1}
          />
          <button onClick={handleSend} disabled={isTyping || !input.trim() || gameResult !== 'playing'} className="bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white w-16 h-16 rounded-[1.5rem] shadow-2xl transition-all active:scale-90 flex items-center justify-center border-b-8 border-slate-700 active:border-b-0 active:translate-y-2 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fire { 0%, 100% { filter: brightness(1) saturate(1.2); } 50% { filter: brightness(1.5) saturate(1.8) contrast(1.2); } }
        .animate-fire { animation: fire 1s infinite alternate; }
        @keyframes vibrate-soft { 0% { transform: translate(0); } 33% { transform: translate(0.5px, -0.5px); } 66% { transform: translate(-0.5px, 0.5px); } 100% { transform: translate(0); } }
        .animate-vibrate-soft { animation: vibrate-soft 0.2s infinite; }
        @keyframes shake-heart { 0%, 100% { transform: rotate(0) scale(1); } 25% { transform: rotate(-10deg) scale(0.95); } 75% { transform: rotate(10deg) scale(0.95); } }
        .animate-shake-heart { animation: shake-heart 0.3s infinite; }
        @keyframes heart-beat-fast { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.6); } }
        .animate-heart-beat-fast { animation: heart-beat-fast 0.4s infinite; }
        @keyframes pulse-scale { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .animate-pulse-scale { animation: pulse-scale 0.6s infinite; }
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .animate-bounce-subtle { animation: bounce-subtle 0.6s infinite; }
        @keyframes shake-subtle { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(2px); } 75% { transform: translateX(-2px); } }
        .animate-shake-subtle { animation: shake-subtle 0.2s infinite; }
        @keyframes scan { 0% { background-position: -100% 0; } 100% { background-position: 100% 0; } }
        .animate-scan { animation: scan 1.5s infinite linear; }
        @keyframes pop-in { 0% { transform: scale(0.8) rotate(-5deg); opacity: 0; } 100% { transform: scale(1) rotate(-1deg); opacity: 1; } }
        .animate-pop-in { animation: pop-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default ChatInterface;
