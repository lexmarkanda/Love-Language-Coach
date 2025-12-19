import React, { useState, useEffect, useRef } from 'react';
import { ScenarioData, ChatMessage } from '../types';
import { generateReplyAndFeedback } from '../services/geminiService';

interface ChatInterfaceProps {
  scenario: ScenarioData;
  onExit: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ scenario, onExit }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [practiceCount, setPracticeCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const GOAL = 3;

  // Initialize chat
  useEffect(() => {
    // Initial GF message
    const initialMsg: ChatMessage = {
      id: 'init',
      sender: 'ai',
      text: scenario.introMessage,
      timestamp: Date.now()
    };
    setMessages([initialMsg]);
  }, [scenario]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsgText = input;
    const userMsgId = Date.now().toString();
    
    // Add User Message immediately
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: userMsgText,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setPracticeCount(prev => Math.min(prev + 1, GOAL));

    // Prepare history for API
    const history = messages.map(m => ({
      role: m.sender === 'user' ? 'user' as const : 'model' as const,
      content: m.text
    }));

    // Call API
    const response = await generateReplyAndFeedback(scenario, history, userMsgText);

    setIsTyping(false);

    // Update User Message with Feedback
    setMessages(prev => prev.map(m => {
      if (m.id === userMsgId) {
        return {
          ...m,
          feedback: {
            score: response.coachFeedback.score,
            critique: response.coachFeedback.comment,
            betterAlternative: response.coachFeedback.suggestion
          }
        };
      }
      return m;
    }));

    // Add AI Reply
    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: response.girlfriendReply,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, aiMsg]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <button onClick={onExit} className="text-gray-500 hover:text-red-500 text-sm font-medium">
          結束
        </button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-gray-800">{scenario.emoji} {scenario.title}</span>
          <div className="flex items-center gap-1 text-xs">
            <span className={practiceCount >= GOAL ? "text-green-500 font-bold" : "text-gray-400"}>
              {practiceCount >= GOAL ? "🎉 達成今日目標" : `進度: ${practiceCount}/${GOAL}`}
            </span>
          </div>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            
            {/* Message Bubble */}
            <div 
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-rose-500 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>

            {/* Coach Feedback Box */}
            {msg.sender === 'user' && msg.feedback && (
              <div className="mt-2 mr-1 max-w-[85%] bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs relative animate-fade-in-up">
                <div className="absolute -top-2 right-4 w-3 h-3 bg-amber-50 border-t border-l border-amber-200 transform rotate-45"></div>
                <div className="flex items-center gap-2 mb-2 border-b border-amber-100 pb-2">
                  <span className="text-xl">🕵️‍♂️</span>
                  <span className="font-bold text-amber-800 uppercase tracking-wider">導師點評</span>
                  <div className="ml-auto flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < msg.feedback!.score ? "text-amber-500" : "text-gray-300"}>♥</span>
                    ))}
                  </div>
                </div>
                <p className="text-amber-900 mb-2">
                  <span className="font-semibold">分析：</span> {msg.feedback.critique}
                </p>
                <div className="bg-white/60 p-2 rounded-lg text-amber-800">
                  <span className="font-semibold block mb-1 text-amber-600">💡 試試這樣說：</span>
                  "{msg.feedback.betterAlternative}"
                </div>
              </div>
            )}
          </div>
        ))}

        {practiceCount === GOAL && messages[messages.length - 1]?.sender === 'ai' && (
           <div className="flex justify-center my-4 animate-fade-in-up">
             <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-xs font-bold shadow-sm border border-green-200 flex items-center gap-2">
               <span>🏆</span>
               恭喜！你已完成今日 {GOAL} 次不同句型的練習挑戰！
             </div>
           </div>
        )}
        
        {isTyping && (
          <div className="flex items-center space-x-2 p-2">
             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200 sticky bottom-0">
        <div className="flex gap-2 items-end max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="輸入你的回覆..."
            className="flex-1 bg-gray-100 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all resize-none max-h-32 min-h-[50px] scrollbar-hide"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 text-white p-3 rounded-full shadow-lg transition-transform active:scale-95 flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          導師會在每次回覆後提供即時建議
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;