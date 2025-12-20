
import React, { useState } from 'react';
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
    const random = personas[Math.floor(Math.random() * personas.length)];
    handlePersonaSelect(random);
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
                className="w-full py-5 bg-white border-2 border-blue-100 rounded-2xl flex items-center justify-center gap-4 hover:border-blue-400 hover:bg-blue-50 transition-all group shadow-sm"
              >
                <span className="text-3xl group-hover:scale-125 transition-transform">🙋‍♂️</span>
                <span className="text-xl font-bold text-blue-600">我是男生</span>
              </button>
              <button 
                onClick={() => handleGenderSelect('female')}
                className="w-full py-5 bg-white border-2 border-pink-100 rounded-2xl flex items-center justify-center gap-4 hover:border-pink-400 hover:bg-pink-50 transition-all group shadow-sm"
              >
                <span className="text-3xl group-hover:scale-125 transition-transform">🙋‍♀️</span>
                <span className="text-xl font-bold text-pink-600">我是女生</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW: PERSONA SELECT */}
        {currentView === 'PERSONA_SELECT' && (
          <div className="flex flex-col h-full overflow-hidden bg-slate-50">
            <header className="p-8 bg-white pb-6 border-b border-gray-100">
              <button onClick={() => setCurrentView('LANDING')} className="text-gray-400 text-xs mb-4">← 返回性別選擇</button>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">選擇挑戰對象</h1>
              <p className="text-gray-500 text-xs mt-1">你想攻略哪種性格的{playerGender === 'male' ? '女友' : '男友'}？</p>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 scrollbar-hide">
              {personas.map((persona, idx) => (
                <button
                  key={persona.id}
                  onClick={() => handlePersonaSelect(persona)}
                  className="bg-white border-4 border-transparent hover:border-slate-900 rounded-[2rem] p-5 flex flex-col items-center text-center shadow-md transition-all group animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <span className="text-5xl mb-3 group-hover:scale-110 transition-transform">{persona.avatar}</span>
                  <span className="text-sm font-black text-gray-800">{persona.name}</span>
                  <div className="mt-2 flex gap-1 flex-wrap justify-center">
                    {persona.likes.slice(0, 2).map(l => (
                      <span key={l} className="text-[8px] bg-slate-100 px-1 rounded font-bold text-slate-400">{l}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6 bg-white border-t border-gray-100">
              <button 
                onClick={handleRandomPersona}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 border-b-8 border-slate-700 active:border-b-0 active:translate-y-2"
              >
                <span>🎲 隨機抽選挑戰</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW: MENU */}
        {currentView === 'MENU' && selectedPersona && (
          <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
            <header className="p-8 bg-white pb-6 sticky top-0 z-10 border-b border-gray-50 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentView('PERSONA_SELECT')} className="text-gray-400 text-xs hover:text-gray-600">← 切換對象</button>
                <div className="flex items-center gap-2 bg-slate-900 px-4 py-1.5 rounded-full shadow-lg">
                  <span className="text-xl">{selectedPersona.avatar}</span>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{selectedPersona.name}</span>
                </div>
              </div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">特訓主題選擇</h1>
              <p className="text-gray-500 text-xs mt-1 font-bold">對準目標，開始你的氛圍感修煉</p>
            </header>
            
            <div className="px-6 pb-20 pt-6 grid grid-cols-1 gap-6">
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
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes pop-in { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-pop-in { animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
}

export default App;
