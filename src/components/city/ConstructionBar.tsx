import React from 'react';
import { ItemCatalogoConstrucao } from '../../types/city';
import { CATALOGO_OBRAS_PUBLICAS } from '../../engine/city/buildingCatalog';
import { formatarMoeda } from '../../lib/utils';
import {
  Activity,
  Baby,
  GraduationCap,
  Droplet,
  Trees,
  Navigation,
  Road,
  Building2,
  X,
  AlertCircle,
  HardHat,
} from 'lucide-react';

interface ConstructionBarProps {
  obraSelecionada?: ItemCatalogoConstrucao;
  onSelecionarObra: (obra?: ItemCatalogoConstrucao) => void;
  margemInvestimentoDisponivel: number;
}

export const ConstructionBar: React.FC<ConstructionBarProps> = ({
  obraSelecionada,
  onSelecionarObra,
  margemInvestimentoDisponivel,
}) => {
  const getIcone = (iconeNome: string) => {
    switch (iconeNome) {
      case 'Activity': return <Activity className="w-5 h-5 text-rose-400" />;
      case 'Baby': return <Baby className="w-5 h-5 text-amber-400" />;
      case 'GraduationCap': return <GraduationCap className="w-5 h-5 text-blue-400" />;
      case 'Droplet': return <Droplet className="w-5 h-5 text-cyan-400" />;
      case 'Trees': return <Trees className="w-5 h-5 text-emerald-400" />;
      case 'Navigation': return <Navigation className="w-5 h-5 text-yellow-400" />;
      case 'Road': return <Road className="w-5 h-5 text-slate-300" />;
      default: return <Building2 className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-2.5 sm:p-3 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Cabeçalho da Barra de Obras */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-500/20 text-amber-400">
              <HardHat className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Plano de Obras Públicas (LOA & PPA)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs">
              <span className="text-slate-400 mr-1.5 hidden sm:inline">Margem de Investimento Livre:</span>
              <span className={`font-mono font-bold ${margemInvestimentoDisponivel > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatarMoeda(margemInvestimentoDisponivel)}
              </span>
            </div>

            {obraSelecionada && (
              <button
                onClick={() => onSelecionarObra(undefined)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 flex items-center gap-1 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
            )}
          </div>
        </div>

        {/* Carrossel Horizontal de Construções */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {CATALOGO_OBRAS_PUBLICAS.map((obra) => {
            const selecionada = obraSelecionada?.id === obra.id;
            const temRecurso = margemInvestimentoDisponivel >= obra.custoCapital;

            return (
              <button
                key={obra.id}
                onClick={() => onSelecionarObra(selecionada ? undefined : obra)}
                className={`flex-shrink-0 w-48 sm:w-56 p-2.5 rounded-xl border text-left transition-all relative ${
                  selecionada
                    ? 'bg-blue-600/25 border-blue-500 ring-2 ring-blue-500/30 text-white'
                    : temRecurso
                    ? 'bg-slate-800/80 border-slate-700/70 hover:border-slate-600 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-75'
                }`}
              >
                {/* Tag de Vinculação */}
                {obra.setorVinculado && (
                  <span
                    className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                      obra.setorVinculado === 'SAUDE'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : obra.setorVinculado === 'EDUCACAO'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {obra.setorVinculado === 'SAUDE'
                      ? 'Saúde 15%'
                      : obra.setorVinculado === 'EDUCACAO'
                      ? 'Educ. 25%'
                      : 'Infra'}
                  </span>
                )}

                <div className="flex items-start gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/50">
                    {getIcone(obra.iconeNome)}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold truncate text-slate-100">{obra.nome}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{obra.categoria}</p>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Custo de Capital</span>
                    <span className="text-xs font-mono font-bold text-white">
                      {formatarMoeda(obra.custoCapital)}
                    </span>
                  </div>

                  <div className="text-right text-[10px] text-slate-400">
                    {obra.folhaAnual > 0 && (
                      <span className="block text-amber-400/90 font-mono">
                        +{formatarMoeda(obra.folhaAnual)}/ano folha
                      </span>
                    )}
                    {obra.custeioAnual > 0 && (
                      <span className="block text-slate-400 font-mono">
                        +{formatarMoeda(obra.custeioAnual)}/ano custeio
                      </span>
                    )}
                  </div>
                </div>

                {!temRecurso && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-400 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    <span>Sem margem livre na LOA</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
