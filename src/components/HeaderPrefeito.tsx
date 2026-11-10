import React from 'react';
import { EstadoSimulacao } from '../types/simulation';
import { formatarMoeda } from '../lib/utils';
import { Landmark, Calendar, DollarSign, Award, ChevronRight, Users } from 'lucide-react';

interface HeaderPrefeitoProps {
  estado: EstadoSimulacao;
  onAvancarMes: () => void;
  onAbrirDecisoes: () => void;
}

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const HeaderPrefeito: React.FC<HeaderPrefeitoProps> = ({
  estado,
  onAvancarMes,
  onAbrirDecisoes,
}) => {
  const { mesAtual, anoMandato, anoExercicio, cidade } = estado;
  const mesNome = NOMES_MESES[mesAtual - 1];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Identificação Municipal */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight">{cidade.nome}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Poder Executivo
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {cidade.populacao.toLocaleString('pt-BR')} hab.
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Calendar className="w-3.5 h-3.5" /> {mesNome} / {anoExercicio} (Ano {anoMandato}º do PPA)
              </span>
            </div>
          </div>
        </div>

        {/* Indicadores Chave de Gestão */}
        <div className="flex items-center flex-wrap gap-2 md:gap-4">
          {/* Caixa do Tesouro */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Caixa Disponível</p>
              <p className="text-xs md:text-sm font-bold text-emerald-400">{formatarMoeda(cidade.caixaTesouro)}</p>
            </div>
          </div>

          {/* Aprovação Popular */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <div className="p-1 rounded bg-amber-500/10 text-amber-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Aprovação</p>
              <div className="flex items-center gap-1.5">
                <p className="text-xs md:text-sm font-bold text-amber-400">{cidade.aprovacaoPrefeito}%</p>
                <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${cidade.aprovacaoPrefeito}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 ml-auto md:ml-0">
            <button
              onClick={onAbrirDecisoes}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30 transition-all flex items-center gap-1.5 active:scale-95"
            >
              Gabinete / Atos
            </button>
            <button
              onClick={onAvancarMes}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>Avançar Mês</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
