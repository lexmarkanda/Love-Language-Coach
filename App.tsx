
import React, { useState } from 'react';
import { ScenarioId, ScenarioData } from './types';
import { SCENARIOS } from './constants';
import ScenarioCard from './components/ScenarioCard';
import CheatSheet from './components/CheatSheet';
import ChatInterface from './components/ChatInterface';

type View = 'MENU' | 'LEARN' | 'PRACTICE';

function App() {
  const [currentView, setCurrentView] = useState<View>('MENU');
  const [selectedScenarioId, setSelectedScenarioId] = useState<ScenarioId | null>(null);

  const selectedScenario = selectedScenarioId ? SCENARIOS[selectedScenarioId] : null;

  const handleScenarioSelect = (id: ScenarioId) => {
    setSelectedScenarioId(id);
    setCurrentView('LEARN');
  };

  const startPractice = () => {
    setCurrentView('PRACTICE');
  };

  const goBackToMenu = () => {
    setCurrentView('MENU');
    setSelectedScenarioId(null);
  };

  const goBackToLearn = () => {
    setCurrentView('LEARN');
  };

  return (
    <div className="h-screen w-full flex justify-center bg-rose-50 overflow-hidden">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl relative flex flex-col">
        
        {/* VIEW: MENU */}
        {currentView === 'MENU' && (
          <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
            <header className="p-8 bg-white pb-6 sticky top-0 z-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                <span className="text-rose-500">Love</span> Language
              </h1>
              <p className="text-gray-500 text-sm">感情升溫大師：從日常對話開始</p>
            </header>
            
            <div className="px-6 pb-6 grid grid-cols-1 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-2 animate-fade-in-up">
                <h3 className="font-bold text-blue-800 text-sm mb-1">👋 歡迎來到特訓班</h3>
                <p className="text-blue-700 text-xs">
                  不知道怎麼說甜言蜜語？選擇一個情境，我會教你如何擺脫單調的回答，讓她感受到你滿滿的愛意。
                </p>
              </div>

              {Object.values(SCENARIOS).map((scenario, idx) => (
                <div key={scenario.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <ScenarioCard 
                    scenario={scenario} 
                    onClick={() => handleScenarioSelect(scenario.id)} 
                  />
                </div>
              ))}
            </div>
            
            <footer className="mt-auto p-6 text-center text-gray-400 text-xs">
              Built with Gemini AI • Practice makes perfect
            </footer>
          </div>
        )}

        {/* VIEW: LEARN (Cheat Sheet) */}
        {currentView === 'LEARN' && selectedScenario && (
          <div className="h-full animate-slide-in">
            <CheatSheet 
              scenario={selectedScenario} 
              onStartPractice={startPractice}
              onBack={goBackToMenu}
            />
          </div>
        )}

        {/* VIEW: PRACTICE (Chat) */}
        {currentView === 'PRACTICE' && selectedScenario && (
          <div className="h-full animate-slide-in">
            <ChatInterface 
              scenario={selectedScenario} 
              onExit={goBackToLearn}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default App;
