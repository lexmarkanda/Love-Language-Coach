import React from 'react';
import { ScenarioData } from '../types';

interface CheatSheetProps {
  scenario: ScenarioData;
  onStartPractice: () => void;
  onBack: () => void;
}

const CheatSheet: React.FC<CheatSheetProps> = ({ scenario, onStartPractice, onBack }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between shadow-sm">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>{scenario.emoji}</span> {scenario.title} 秘笈
        </h2>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <div className="p-5 space-y-6 pb-24 max-w-2xl mx-auto w-full">
        {/* Intro */}
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-2xl border border-rose-100">
          <h3 className="text-rose-600 font-bold mb-2 text-sm uppercase tracking-wide">學習重點</h3>
          <p className="text-gray-700">{scenario.description}</p>
        </div>

        {/* Examples */}
        <div>
          <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
            <span className="bg-amber-100 text-amber-600 p-1 rounded-md text-xs">範例</span>
            <span>推薦句型</span>
          </h3>
          <div className="space-y-3">
            {scenario.examples.map((ex, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-gray-700 hover:border-rose-200 transition-colors">
                "{ex}"
              </div>
            ))}
          </div>
        </div>

        {/* Replacements */}
        <div>
          <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 p-1 rounded-md text-xs">詞彙</span>
            <span>替換詞語</span>
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {scenario.replacements.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="font-bold text-gray-400 line-through decoration-rose-500 decoration-2">
                  {item.word}
                </div>
                <div className="hidden sm:block text-gray-300">→</div>
                <div className="flex flex-wrap gap-2">
                  {item.alternatives.map((alt, aidx) => (
                    <span key={aidx} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-100">
                      {alt}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 flex justify-center">
        <button
          onClick={onStartPractice}
          className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-rose-500/30 transform active:scale-95 transition-all w-full max-w-md flex items-center justify-center gap-2"
        >
          <span>開始互動練習</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CheatSheet;