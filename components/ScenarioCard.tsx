import React from 'react';
import { ScenarioData } from '../types';

interface ScenarioCardProps {
  scenario: ScenarioData;
  onClick: () => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-pink-100 flex flex-col items-center text-center w-full group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-300 to-rose-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      
      <div className="text-4xl mb-3 bg-pink-50 p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
        {scenario.emoji}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{scenario.title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">
        {scenario.description}
      </p>
      <span className="mt-4 text-rose-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        開始練習 →
      </span>
    </button>
  );
};

export default ScenarioCard;