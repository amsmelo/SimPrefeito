import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ControleInternoAlertasProps {
  alertas: string[];
}

export const ControleInternoAlertas: React.FC<ControleInternoAlertasProps> = ({ alertas }) => {
  if (!alertas || alertas.length === 0) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
          <ShieldAlert className="w-4 h-4" />
        </span>
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Parecer do Órgão de Controle Interno & Tribunal de Contas
          </h3>
          <p className="text-[11px] text-slate-400">
            Acompanhamento contínuo da LRF, pisos constitucionais e metas orçamentárias
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {alertas.map((parecer, idx) => {
          let estilo = 'bg-slate-800/40 border-slate-700/50 text-slate-300';
          let icone = <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />;

          if (parecer.includes('CRÍTICO') || parecer.includes('ILEGALIDADE') || parecer.includes('ALERTA FISCAL')) {
            estilo = 'bg-rose-500/10 border-rose-500/30 text-rose-300';
            icone = <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />;
          } else if (parecer.includes('ATENÇÃO') || parecer.includes('ALERTA - LRF')) {
            estilo = 'bg-amber-500/10 border-amber-500/30 text-amber-300';
            icone = <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />;
          } else if (parecer.includes('REGULAR')) {
            estilo = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
            icone = <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />;
          }

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${estilo}`}
            >
              {icone}
              <p className="leading-relaxed">{parecer}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
