import React from 'react';
import { DecisaoPolitica } from '../types/simulation';
import { formatarMoeda } from '../lib/utils';
import { X, Check, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DecisoesModalProps {
  aberto: boolean;
  onFechar: () => void;
  onExecutarDecisao: (decisao: DecisaoPolitica) => void;
  caixaDisponivel: number;
}

const DECISOES_DISPONIVEIS: DecisaoPolitica[] = [
  {
    id: 'dec-reajuste-folha',
    titulo: 'Conceder Reajuste Geral de 5% aos Servidores Municipais',
    descricao: 'Concede reposição inflacionária para todas as categorias do funcionalismo público municipal.',
    custoImediato: 0,
    impactoPessoalAnual: 2_400_000,
    impactoCusteioAnual: 0,
    impactoReceitaAnual: 0,
    impactoAprovacao: 8,
    setor: 'ADMINISTRACAO',
  },
  {
    id: 'dec-equipes-saude',
    titulo: 'Contratar 20 Médicos e 4 Equipes de Saúde da Família',
    descricao: 'Amplia o atendimento nos postos de saúde de atenção básica e reduz filas de espera.',
    custoImediato: 500_000,
    impactoPessoalAnual: 1_600_000,
    impactoCusteioAnual: 300_000,
    impactoReceitaAnual: 0,
    impactoAprovacao: 5,
    setor: 'SAUDE',
  },
  {
    id: 'dec-obras-asfalto',
    titulo: 'Executar Lote de Pavimentação Asfáltica e Drenagem (PPA)',
    descricao: 'Obras de asfalto novo e drenagem pluvial em bairros periféricos para conter enchentes.',
    custoImediato: 2_500_000,
    impactoPessoalAnual: 0,
    impactoCusteioAnual: 150_000,
    impactoReceitaAnual: 0,
    impactoAprovacao: 6,
    setor: 'INFRAESTRUTURA',
  },
  {
    id: 'dec-fiscalizacao-iss',
    titulo: 'Intensificar Fiscalização Tributária Eletrônica do ISS',
    descricao: 'Implantação de cruzamento de dados com notas fiscais de serviços e bancos.',
    custoImediato: 400_000,
    impactoPessoalAnual: 0,
    impactoCusteioAnual: 50_000,
    impactoReceitaAnual: 2_800_000,
    impactoAprovacao: -2,
    setor: 'ADMINISTRACAO',
  },
  {
    id: 'dec-corte-comissionados',
    titulo: 'Reduzir 25% dos Cargos em Comissão do Gabinete',
    descricao: 'Medida de austeridade legal para enquadramento nos limites da LRF e corte de despesas fixas.',
    custoImediato: 0,
    impactoPessoalAnual: -1_800_000,
    impactoCusteioAnual: -100_000,
    impactoReceitaAnual: 0,
    impactoAprovacao: -4,
    setor: 'ADMINISTRACAO',
  },
];

export const DecisoesModal: React.FC<DecisoesModalProps> = ({
  aberto,
  onFechar,
  onExecutarDecisao,
  caixaDisponivel,
}) => {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white">Gabinete do Prefeito - Decisões Administrativas</h3>
            <p className="text-xs text-slate-400">Atos e decretos municipais com impacto fiscal e na LRF</p>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Atos Disponíveis */}
        <div className="p-4 overflow-y-auto space-y-3 scrollbar-thin">
          {DECISOES_DISPONIVEIS.map((dec) => {
            const caixaSuficiente = caixaDisponivel >= dec.custoImediato;

            return (
              <div
                key={dec.id}
                className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{dec.titulo}</h4>
                    <p className="text-xs text-slate-300 mt-0.5">{dec.descricao}</p>
                  </div>
                  {dec.custoImediato > 0 && (
                    <span className="self-start text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 whitespace-nowrap">
                      Custo: {formatarMoeda(dec.custoImediato)}
                    </span>
                  )}
                </div>

                {/* Impactos Previstos */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                  {dec.impactoPessoalAnual !== 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                        dec.impactoPessoalAnual > 0
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {dec.impactoPessoalAnual > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      Folha Pessoal: {dec.impactoPessoalAnual > 0 ? '+' : ''}{formatarMoeda(dec.impactoPessoalAnual)}/ano
                    </span>
                  )}

                  {dec.impactoReceitaAnual !== 0 && (
                    <span className="px-2 py-0.5 rounded-md font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      Receita Própria: +{formatarMoeda(dec.impactoReceitaAnual)}/ano
                    </span>
                  )}

                  <span
                    className={`px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                      dec.impactoAprovacao >= 0
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    Aprovação: {dec.impactoAprovacao > 0 ? '+' : ''}{dec.impactoAprovacao}%
                  </span>
                </div>

                {/* Botão de Decretar */}
                <div className="flex justify-end pt-1">
                  <button
                    disabled={!caixaSuficiente}
                    onClick={() => {
                      onExecutarDecisao(dec);
                      onFechar();
                    }}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      caixaSuficiente
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 active:scale-95'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{caixaSuficiente ? 'Assinar Decreto' : 'Saldo Insuficiente no Caixa'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
