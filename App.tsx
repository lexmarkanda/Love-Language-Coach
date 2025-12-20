
import React, { useState, useEffect } from 'react';
import { ScenarioId, ScenarioData, Gender, PersonaData } from './types';
import { SCENARIOS, MALE_PERSONAS, FEMALE_PERSONAS } from './constants';
import ScenarioCard from './components/ScenarioCard';
import CheatSheet from './components/CheatSheet';
import ChatInterface from './components/ChatInterface';

type View = 'LANDING' | 'PERSONA_SELECT' | 'MENU' | 'LEARN' | 'PRACTICE';

function App() {
  const [currentView, setCurrentView] = useState<View>('LANDING');
  const [playerGender, setPlayerGender] = useState<Gender>('male');
  const [selectedPersona, setSelectedPersona] = useState<PersonaData | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<ScenarioId | null>(null);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [randomPersonaIdx, setRandomPersonaIdx] = useState(0);

  const selectedScenario = selectedScenarioId ? SCENARIOS[selectedScenarioId] : null;
  const personas = playerGender === 'male' ? FEMALE_PERSONAS : MALE_PERSONAS;

  const handleGenderSelect = (gender: Gender) => {
    setPlayerGender(gender);
    setCurrentView('PERSONA_SELECT');
  };

  const handlePersonaSelect = (persona: PersonaData) => {
    setSelectedPersona(persona);
    setCurrentView('MENU');
  };

  const handleRandomPersona = () => {
    setIsRandomizing(true);
    let count = 0;
    const interval = setInterval(() => {
      setRandomPersonaIdx(prev => (prev + 1) % personas.length);
      count++;
      if (count > 25) {
        clearInterval(interval);
        setTimeout(() => {
          const finalIdx = Math.floor(Math.random() * personas.length);
          handlePersonaSelect(personas[finalIdx]);
          setIsRandomizing(false);
        }, 600);
      }
    }, 80);
  };

  const handleScenarioSelect = (id: ScenarioId) => {
    setSelectedScenarioId(id);
    setCurrentView('LEARN');
  };

  return (
    <div className="h-screen w-full flex justify-center bg-slate-900 overflow-hidden">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl relative flex flex-col">
        
        {/* VIEW: LANDING */}
        {currentView === 'LANDING' && (
          <div className="flex flex-col h-full items-center justify-center p-8 bg-gradient-to-b from-rose-50 to-white">
            <div className="text-center mb-12 animate-fade-in-up">
              <div className="w-24 h-24 bg-rose-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-rose-200 mx-auto mb-6 transform rotate-12">
                <span className="text-5xl">📱</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">
                氛圍感大師 <span className="text-rose-500">Vibe</span>
              </h1>
              <p className="text-gray-500 font-medium">拒絕聊死，讀懂空氣的戀愛特訓</p>
            </div>

            <div className="w-full space-y-4 max-w-xs animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">選擇你的角色</p>
              <button 
                onClick={() => handleGenderSelect('male')}
                className="w-full py-6 bg-white border-2 border-blue-100 rounded-2xl flex items-center justify-center gap-4 hover:border-blue-400 hover:bg-blue-50 transition-all group shadow-sm"
              >
                <span className="text-4xl group-hover:scale-125 transition-transform">🙋‍♂️</span>
                <span className="text-2xl font-black text-blue-600">我是男生</span>
              </button>
              <button 
                onClick={() => handleGenderSelect('female')}
                className="w-full py-6 bg-white border-2 border-pink-100 rounded-2xl flex items-center justify-center gap-4 hover:border-pink-400 hover:bg-pink-50 transition-all group shadow-sm"
              >
                <span className="text-4xl group-hover:scale-125 transition-transform">🙋‍♀️</span>
                <span className="text-2xl font-black text-pink-600">我是女生</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW: PERSONA SELECT */}
        {currentView === 'PERSONA_SELECT' && (
          <div className="flex flex-col h-full overflow-hidden bg-slate-50 relative">
            {/* Randomizing Animation Overlay */}
            {isRandomizing && (
              <div className="absolute inset-0 z-[200] bg-slate-900/95 flex flex-col items-center justify-center p-8 backdrop-blur-md">
                <div className="bg-white border-4 border-slate-900 rounded-full w-48 h-48 flex items-center justify-center text-8xl shadow-2xl animate-spin-fast">
                  {personas[randomPersonaIdx].avatar}
                </div>
                <h3 className="text-white text-3xl font-black italic mt-12 animate-pulse tracking-[0.2em] uppercase">Target Lock...</h3>
                <div className="mt-4 flex gap-3">
                  {[0, 1, 2].map(i => <div key={i} className="w-4 h-4 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.2}s` }} />)}
                </div>
              </div>
            )}

            <header className="p-8 bg-white pb-6 border-b border-gray-100">
              <button onClick={() => setCurrentView('LANDING')} className="text-gray-400 text-xs mb-4">← 返回角色選擇</button>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight italic">選擇挑戰對象</h1>
              <p className="text-gray-500 text-sm mt-1 font-medium">你想攻略哪種性格的{playerGender === 'male' ? '女友' : '男友'}？</p>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-5 scrollbar-hide pb-28">
              {personas.map((persona, idx) => (
                <button
                  key={persona.id}
                  onClick={() => handlePersonaSelect(persona)}
                  className="bg-white border-4 border-transparent hover:border-slate-900 rounded-[2.5rem] p-6 flex flex-col items-center text-center shadow-md transition-all group animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <span className="text-7xl mb-4 group-hover:scale-110 transition-transform duration-300">{persona.avatar}</span>
                  <span className="text-2xl font-black text-gray-800 tracking-tighter">{persona.name}</span>
                  <div className="mt-3 flex gap-1.5 flex-wrap justify-center">
                    {persona.likes.slice(0, 2).map(l => (
                      <span key={l} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-black text-slate-500 uppercase">#{l}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
              <button 
                onClick={handleRandomPersona}
                disabled={isRandomizing}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 border-b-8 border-slate-700 active:border-b-0 active:translate-y-2 shadow-2xl"
              >
                <span>🎲 命運隨機抽取</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW: MENU */}
        {currentView === 'MENU' && selectedPersona && (
          <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
            <header className="p-8 bg-white pb-6 sticky top-0 z-10 border-b border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setCurrentView('PERSONA_SELECT')} className="text-gray-400 text-xs hover:text-gray-600 font-bold">← 更換攻略對象</button>
                <div className="flex items-center gap-3 bg-slate-900 px-5 py-2.5 rounded-full shadow-2xl border-2 border-slate-800">
                  <span className="text-2xl">{selectedPersona.avatar}</span>
                  <span className="text-xs font-black text-white uppercase tracking-widest">{selectedPersona.name}</span>
                </div>
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">實戰主題選擇</h1>
              <p className="text-gray-500 text-sm mt-1 font-bold">鎖定情境，開始你的氛圍感攻略</p>
            </header>
            
            <div className="px-6 pb-20 pt-8 grid grid-cols-1 gap-8">
              {Object.values(SCENARIOS).map((scenario, idx) => (
                <div key={scenario.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <ScenarioCard scenario={scenario} onClick={() => handleScenarioSelect(scenario.id)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: LEARN */}
        {currentView === 'LEARN' && selectedScenario && (
          <CheatSheet scenario={selectedScenario} onStartPractice={() => setCurrentView('PRACTICE')} onBack={() => setCurrentView('MENU')} />
        )}

        {/* VIEW: PRACTICE */}
        {currentView === 'PRACTICE' && selectedScenario && selectedPersona && (
          <ChatInterface scenario={selectedScenario} persona={selectedPersona} playerGender={playerGender} onExit={() => setCurrentView('LEARN')} />
        )}
      </div>

      <style>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes spin-fast {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .animate-spin-fast { animation: spin-fast 0.3s linear infinite; }
      `}</style>
    </div>
  );
}

export default App;
