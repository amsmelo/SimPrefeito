import React from 'react';
import { TipoOverlay } from '../../types/city';
import { Eye, Activity, GraduationCap, DollarSign, Droplets } from 'lucide-react';

interface OverlayControlsProps {
  overlayAtual: TipoOverlay;
  onSelecionarOverlay: (overlay: TipoOverlay) => void;
}

export const OverlayControls: React.FC<OverlayControlsProps> = ({
  overlayAtual,
  onSelecionarOverlay,
}) => {
  const opcoes: { tipo: TipoOverlay; label: string; icone: React.ReactNode; cor: string }[] = [
    {
      tipo: 'NORMAL',
      label: 'Normal',
      icone: <Eye className="w-3.5 h-3.5" />,
      cor: 'border-slate-600',
    },
    {
      tipo: 'SAUDE',
      label: 'Raio de Saúde',
      icone: <Activity className="w-3.5 h-3.5 text-rose-400" />,
      cor: 'border-rose-500/40 text-rose-300',
    },
    {
      tipo: 'EDUCACAO',
      label: 'Escolas & Creches',
      icone: <GraduationCap className="w-3.5 h-3.5 text-blue-400" />,
      cor: 'border-blue-500/40 text-blue-300',
    },
    {
      tipo: 'VALOR_VENAL',
      label: 'Planta de Valores (IPTU)',
      icone: <DollarSign className="w-3.5 h-3.5 text-amber-400" />,
      cor: 'border-amber-500/40 text-amber-300',
    },
    {
      tipo: 'SANEAMENTO',
      label: 'Saneamento',
      icone: <Droplets className="w-3.5 h-3.5 text-cyan-400" />,
      cor: 'border-cyan-500/40 text-cyan-300',
    },
  ];

  return (
    <div className="fixed top-20 left-3 z-30 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl flex flex-wrap gap-1 max-w-[calc(100vw-1.5rem)] sm:max-w-max">
      {opcoes.map((op) => {
        const ativo = overlayAtual === op.tipo;
        return (
          <button
            key={op.tipo}
            onClick={() => onSelecionarOverlay(op.tipo)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap ${
              ativo
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {op.icone}
            <span className="hidden sm:inline">{op.label}</span>
          </button>
        );
      })}
    </div>
  );
};
