import React, { useState } from 'react';
import { PPA, LOA } from '../types/planning';
import { formatarMoeda } from '../lib/utils';
import { Layers, Target, Compass, PieChart } from 'lucide-react';

interface PlanningViewProps {
  ppa: PPA;
  loa: LOA;
  anoMandato: 1 | 2 | 3 | 4;
}

export const PlanningView: React.FC<PlanningViewProps> = ({ ppa, loa, anoMandato }) => {
  const [abaAtiva, setAbaAtiva] = useState<'PPA' | 'LOA'>('PPA');
  const [programaSelecionadoId, setProgramaSelecionadoId] = useState<string>(ppa.programas[0]?.id || '');

  const programaSelecionado = ppa.programas.find((p) => p.id === programaSelecionadoId) || ppa.programas[0];

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
      {/* Abas PPA vs LOA */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAbaAtiva('PPA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              abaAtiva === 'PPA'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>PPA (Quadriênio {ppa.anoInicio}-{ppa.anoFim})</span>
          </button>

          <button
            onClick={() => setAbaAtiva('LOA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              abaAtiva === 'LOA'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>LOA ({loa.anoExercicio} - Ano {anoMandato}º)</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline">
          {abaAtiva === 'PPA' ? 'Planejamento Estratégico de Médio Prazo' : 'Orçamento Anual Operacional'}
        </span>
      </div>

      {abaAtiva === 'PPA' ? (
        <div className="space-y-4">
          {/* Seletor de Programas Temáticos do PPA */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {ppa.programas.map((prog) => {
              const selecionado = prog.id === programaSelecionado.id;
              return (
                <button
                  key={prog.id}
                  onClick={() => setProgramaSelecionadoId(prog.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-all text-left flex items-center gap-2 ${
                    selecionado
                      ? 'bg-blue-500/15 border-blue-500/50 text-blue-300'
                      : 'bg-slate-900/40 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-mono text-[10px] text-blue-400">Prog. {prog.codigo}</span>
                  <span>{prog.nome}</span>
                </button>
              );
            })}
          </div>

          {/* Detalhes do Programa Temático Selecionado */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                  {programaSelecionado.orgaoResponsavel}
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  Custo Plurianual: {formatarMoeda(programaSelecionado.metaFinanceira.custoTotalPlurianual)}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">{programaSelecionado.nome}</h3>
              <p className="text-xs text-slate-400 mt-1">{programaSelecionado.descricao}</p>
              <div className="mt-2 text-xs text-slate-300 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/40">
                <span className="font-semibold text-blue-400">Objetivo Estratégico: </span>
                {programaSelecionado.objetivoEstrategico}
              </div>
            </div>

            {/* Metas Físicas Quadrienais & Anuais */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                <span>Metas Físicas Quadrienais (4 Anos)</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {programaSelecionado.metasFisicas.map((meta) => {
                  const metaAnualAtual = meta.metasAnuais[anoMandato - 1];
                  const executadoAtual = meta.executadoAnual[anoMandato - 1];
                  const progresso = metaAnualAtual > 0 ? (executadoAtual / metaAnualAtual) * 100 : 0;

                  return (
                    <div key={meta.id} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-2">
                      <div className="flex justify-between items-start text-xs">
                        <span className="font-medium text-slate-200">{meta.indicador}</span>
                        <span className="font-mono text-blue-400 font-bold">
                          {meta.metaQuadrienal} {meta.unidadeMedida}
                        </span>
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Meta Ano {anoMandato}º: {metaAnualAtual} {meta.unidadeMedida}</span>
                        <span>Executado: {executadoAtual}</span>
                      </div>

                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, progresso)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Previsão Financeira Anualizada */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Distribuição Orçamentária Anualizada (PPA)</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {programaSelecionado.metaFinanceira.previsaoAnual.map((valor, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-center ${
                      idx === anoMandato - 1
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-200'
                        : 'bg-slate-800/40 border-slate-700/40 text-slate-400'
                    }`}
                  >
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Ano {idx + 1}º</p>
                    <p className="font-mono font-bold mt-0.5">{formatarMoeda(valor)}</p>
                    {idx === anoMandato - 1 && (
                      <span className="text-[9px] bg-blue-500/30 text-blue-300 px-1.5 py-0.2 rounded-full font-semibold">
                        Ano Vigente
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Visualização da LOA */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
              <span className="text-slate-400">Orçamento Fiscal</span>
              <p className="text-lg font-black text-white mt-0.5">{formatarMoeda(loa.orcamentoFiscal)}</p>
              <p className="text-[11px] text-slate-400">Administração direta, obras e serviços urbanos</p>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
              <span className="text-slate-400">Orçamento da Seguridade Social</span>
              <p className="text-lg font-black text-emerald-400 mt-0.5">{formatarMoeda(loa.orcamentoSeguridadeSocial)}</p>
              <p className="text-[11px] text-slate-400">Ações de Saúde, Assistência e Previdência (CF art. 165)</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Dotações Orçamentárias Derivadas do PPA ({loa.dotacoes.length} Ações Fixadas)
            </h4>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {loa.dotacoes.map((dot) => (
                <div
                  key={dot.id}
                  className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-1 rounded">
                        {dot.codigoDotacao}
                      </span>
                      <span className="font-semibold text-slate-200">{dot.acaoTitulo}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {dot.programaNome} • {dot.categoriaEconomica === 'DESPESAS_DE_CAPITAL' ? 'Investimento (Capital)' : 'Despesa Corrente'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center font-mono">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase">Fixado</p>
                      <p className="font-bold text-white">{formatarMoeda(dot.valorOrcado)}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      Fonte: {dot.fonteRecurso}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
