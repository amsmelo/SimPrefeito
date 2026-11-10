import React, { useState } from 'react';
import { BalancoFiscalCompleto, StatusLRF } from '../types/fiscal';
import { formatarMoeda, formatarPercentual } from '../lib/utils';
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Ban,
  Activity,
  GraduationCap,
  HardHat,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';

interface FiscalDashboardProps {
  balanco: BalancoFiscalCompleto;
}

export const FiscalDashboard: React.FC<FiscalDashboardProps> = ({ balanco }) => {
  const [detalhesReceitaAberto, setDetalhesReceitaAberto] = useState(false);
  const [detalhesRestricoesAberto, setDetalhesRestricoesAberto] = useState(false);

  const { receitas, despesaPessoal, vinculacoes, custeio, margemInvestimento } = balanco;

  // Função auxiliar para cores do status LRF
  const getLRFBadge = (status: StatusLRF) => {
    switch (status) {
      case 'NORMAL':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icone: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
          label: 'NORMAL (< 48,6%)',
        };
      case 'ALERTA':
        return {
          bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
          icone: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
          label: 'ALERTA (48,6% a 51,3%)',
        };
      case 'PRUDENCIAL':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icone: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          label: 'PRUDENCIAL (51,3% a 54%)',
        };
      case 'EXCEDIDO':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse',
          icone: <Ban className="w-4 h-4 text-rose-400" />,
          label: 'LIMITE MÁXIMO EXCEDIDO (> 54%)',
        };
    }
  };

  const lrfInfo = getLRFBadge(despesaPessoal.statusLRF);

  return (
    <div className="space-y-4">
      {/* 1. Visão Geral da Receita Corrente Líquida (RCL) */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 md:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-semibold text-slate-300">Receita Corrente Líquida (RCL Anual)</h2>
            </div>
            <p className="text-2xl font-black text-white mt-1">
              {formatarMoeda(receitas.rcl)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Base oficial para limites da LRF • Receita Bruta: {formatarMoeda(receitas.receitaCorrenteBruta)}
            </p>
          </div>

          <button
            onClick={() => setDetalhesReceitaAberto(!detalhesReceitaAberto)}
            className="self-start sm:self-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-all"
          >
            <span>Detalhamento Tributário</span>
            {detalhesReceitaAberto ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Detalhamento de Receitas Tributárias e Transferências */}
        {detalhesReceitaAberto && (
          <div className="mt-4 pt-4 border-t border-slate-700/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-in fade-in duration-200">
            {/* Receitas Tributárias Próprias */}
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/40 space-y-2">
              <p className="font-semibold text-blue-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Receitas Tributárias Próprias (CF art. 156)
              </p>
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between py-0.5 border-b border-slate-800">
                  <span>IPTU:</span>
                  <span className="font-mono font-medium">{formatarMoeda(receitas.receitasTributarias.iptu)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800">
                  <span>ISS:</span>
                  <span className="font-mono font-medium">{formatarMoeda(receitas.receitasTributarias.iss)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800">
                  <span>ITBI:</span>
                  <span className="font-mono font-medium">{formatarMoeda(receitas.receitasTributarias.itbi)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800">
                  <span>Taxas Municipais:</span>
                  <span className="font-mono font-medium">{formatarMoeda(receitas.receitasTributarias.taxas)}</span>
                </div>
                {receitas.receitasTributarias.cosip && (
                  <div className="flex justify-between py-0.5">
                    <span>COSIP (Iluminação):</span>
                    <span className="font-mono font-medium">{formatarMoeda(receitas.receitasTributarias.cosip)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Transferências Constitucionais */}
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/40 space-y-2">
              <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Transferências Constitucionais (União / Estado)
              </p>
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between py-0.5 border-b border-slate-800">
                  <span>FPM (Fundo de Participação):</span>
                  <span className="font-mono font-medium">{formatarMoeda(receitas.transferencias.fpm)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800">
                  <span>Cota-Parte ICMS (25%):</span>
                  <span className="font-mono font-medium">{formatarMoeda(receitas.transferencias.cotaParteIcms)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800">
                  <span>Cota-Parte IPVA (50%):</span>
                  <span className="font-mono font-medium">{formatarMoeda(receitas.transferencias.cotaParteIpva)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800">
                  <span>Fundeb Recebido:</span>
                  <span className="font-mono font-medium">{formatarMoeda(receitas.transferencias.fundeb)}</span>
                </div>
                <div className="flex justify-between py-0.5 text-rose-400 font-medium">
                  <span>Dedução Retenção Fundeb (-20%):</span>
                  <span className="font-mono">-{formatarMoeda(receitas.deducoes.retencaoFundeb)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Despesa com Pessoal e Limites da LRF (48.6%, 51.3%, 54%) */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 md:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-300">
                Despesa Total com Pessoal (Poder Executivo - LRF Art. 19/20)
              </h3>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white">
                {formatarPercentual(despesaPessoal.percentualSobreRCL)}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                da RCL ({formatarMoeda(despesaPessoal.despesaTotalPessoalLiquida)})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${lrfInfo.bg}`}>
              {lrfInfo.icone}
              <span>{lrfInfo.label}</span>
            </span>
          </div>
        </div>

        {/* Barra de Progresso com os 3 Limites da LRF */}
        <div className="space-y-1.5 pt-2">
          <div className="relative h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
            {/* Faixa segura: 0% a 48.6% (verde) */}
            <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/20" style={{ width: '48.6%' }} />
            {/* Faixa alerta: 48.6% a 51.3% (amarelo) */}
            <div className="absolute top-0 bottom-0 bg-yellow-500/25" style={{ left: '48.6%', width: '2.7%' }} />
            {/* Faixa prudencial: 51.3% a 54% (laranja) */}
            <div className="absolute top-0 bottom-0 bg-amber-500/35" style={{ left: '51.3%', width: '2.7%' }} />
            {/* Faixa excedido: > 54% (vermelho) */}
            <div className="absolute top-0 bottom-0 right-0 bg-rose-500/30" style={{ left: '54%' }} />

            {/* Barra do Prefeito */}
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                despesaPessoal.statusLRF === 'EXCEDIDO'
                  ? 'bg-rose-500'
                  : despesaPessoal.statusLRF === 'PRUDENCIAL'
                  ? 'bg-amber-500'
                  : despesaPessoal.statusLRF === 'ALERTA'
                  ? 'bg-yellow-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (despesaPessoal.percentualSobreRCL / 60) * 100)}%` }}
            />
          </div>

          {/* Marcadores dos Limites LRF */}
          <div className="flex justify-between text-[11px] text-slate-400 px-0.5">
            <span>0%</span>
            <span className="text-yellow-400 font-semibold">Alerta 48,6%</span>
            <span className="text-amber-400 font-semibold">Prudencial 51,3%</span>
            <span className="text-rose-400 font-bold">Máximo 54,0%</span>
          </div>
        </div>

        {/* Botão para ver vedações e restrições ativas da LRF */}
        {despesaPessoal.restricoesAtivas.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setDetalhesRestricoesAberto(!detalhesRestricoesAberto)}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Ver {despesaPessoal.restricoesAtivas.length} restrições legais da LRF ativadas</span>
              {detalhesRestricoesAberto ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {detalhesRestricoesAberto && (
              <div className="mt-2 p-3 bg-slate-900/70 border border-amber-500/30 rounded-xl space-y-1.5 text-xs text-slate-300">
                {despesaPessoal.restricoesAtivas.map((restricao, idx) => (
                  <p key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{restricao}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Pisos Constitucionais: Saúde (15%) e Educação (25%) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Saúde (15% ASPS) */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <Activity className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Saúde (ASPS - Piso 15%)</h4>
                <p className="text-[11px] text-slate-400">Art. 198, § 2º da CF / LC 141</p>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                vinculacoes.saude.cumprido
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {vinculacoes.saude.cumprido ? 'CUMPRIDO' : 'EM DÉFICIT'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-white">
                {formatarPercentual(vinculacoes.saude.percentualAtingido)}
              </span>
              <span className="text-xs text-slate-400 ml-1">/ 15,0%</span>
            </div>
            <p className="text-xs font-mono font-medium text-slate-300">
              {formatarMoeda(vinculacoes.saude.valorAplicadoEfetivo)}
            </p>
          </div>

          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                vinculacoes.saude.cumprido ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, (vinculacoes.saude.percentualAtingido / 20) * 100)}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400">
            {vinculacoes.saude.diferenca >= 0
              ? `Superávit sobre o piso: +${formatarMoeda(vinculacoes.saude.diferenca)}`
              : `Déficit para atingir piso: -${formatarMoeda(Math.abs(vinculacoes.saude.diferenca))}`}
          </p>
        </div>

        {/* Educação (25% MDE) */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <GraduationCap className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Educação (MDE - Piso 25%)</h4>
                <p className="text-[11px] text-slate-400">Art. 212 da CF / EC 108</p>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                vinculacoes.educacao.cumprido
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {vinculacoes.educacao.cumprido ? 'CUMPRIDO' : 'EM DÉFICIT'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-white">
                {formatarPercentual(vinculacoes.educacao.percentualAtingido)}
              </span>
              <span className="text-xs text-slate-400 ml-1">/ 25,0%</span>
            </div>
            <p className="text-xs font-mono font-medium text-slate-300">
              {formatarMoeda(vinculacoes.educacao.valorAplicadoEfetivo)}
            </p>
          </div>

          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                vinculacoes.educacao.cumprido ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, (vinculacoes.educacao.percentualAtingido / 35) * 100)}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400">
            {vinculacoes.educacao.diferenca >= 0
              ? `Superávit sobre o piso: +${formatarMoeda(vinculacoes.educacao.diferenca)}`
              : `Déficit para atingir piso: -${formatarMoeda(Math.abs(vinculacoes.educacao.diferenca))}`}
          </p>
        </div>
      </div>

      {/* 4. Rigidez Orçamentária e Margem Livre de Investimentos */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 md:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <HardHat className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Margem Livre para Novos Investimentos</h3>
              <p className="text-xs text-slate-400">
                Saldo disponível para obras públicas após pagar Folha ({formatarMoeda(despesaPessoal.despesaTotalPessoalLiquida)}) e Custeio da Máquina ({formatarMoeda(custeio.total)})
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xl font-black text-emerald-400">
              {formatarMoeda(margemInvestimento.saldoLivreInvestimento)}
            </p>
            <span className="text-[11px] font-semibold text-slate-400">
              Capacidade: {margemInvestimento.capacidadeInvestimento}
            </span>
          </div>
        </div>

        <div className="pt-1">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Rigidez Orçamentária (Comprometimento da Receita)</span>
            <span className="font-semibold text-slate-200">
              {formatarPercentual(margemInvestimento.percentualComprometimentoRigido)}
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                margemInvestimento.percentualComprometimentoRigido > 95
                  ? 'bg-rose-500'
                  : margemInvestimento.percentualComprometimentoRigido > 85
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, margemInvestimento.percentualComprometimentoRigido)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
