import React from 'react';
import { Map, Briefcase } from 'lucide-react';

interface ViewSwitcherProps {
  visaoAtual: 'MAPA' | 'GABINETE';
  onAlternar: (novaVisao: 'MAPA' | 'GABINETE') => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ visaoAtual, onAlternar }) => {
  return (
    <div className="fixed top-20 right-4 z-40 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1 shadow-2xl flex items-center gap-1">
      <button
        onClick={() => onAlternar('MAPA')}
        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
          visaoAtual === 'MAPA'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        <Map className="w-4 h-4" />
        <span className="hidden sm:inline">Mapa Urbano</span>
      </button>

      <button
        onClick={() => onAlternar('GABINETE')}
        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
          visaoAtual === 'GABINETE'
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        <Briefcase className="w-4 h-4" />
        <span className="hidden sm:inline">Gabinete Fiscal</span>
      </button>
    </div>
  );
};
