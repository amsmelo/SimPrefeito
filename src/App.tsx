import React, { useState } from 'react';
import { SimulationEngine } from './engine/simulation/simulationEngine';
import { HeaderPrefeito } from './components/HeaderPrefeito';
import { FiscalDashboard } from './components/FiscalDashboard';
import { PlanningView } from './components/PlanningView';
import { ControleInternoAlertas } from './components/ControleInternoAlertas';
import { DecisoesModal } from './components/DecisoesModal';
import { IsometricViewport } from './components/city/IsometricViewport';
import { ConstructionBar } from './components/city/ConstructionBar';
import { TileDetailSheet } from './components/city/TileDetailSheet';
import { OverlayControls } from './components/city/OverlayControls';
import { ViewSwitcher } from './components/ui/ViewSwitcher';
import { DecisaoPolitica } from './types/simulation';
import { ItemCatalogoConstrucao, TileData, TipoOverlay } from './types/city';
import { formatarMoeda } from './lib/utils';
import {
  LayoutDashboard,
  Compass,
  History,
  BookOpen,
  DollarSign,
  Users,
  HardHat,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const App: React.FC = () => {
  const [engine] = useState(() => new SimulationEngine('Cidade Modelo', 2025));
  const [estado, setEstado] = useState(() => engine.getEstado());
  const gridManager = engine.getGridManager();

  // Modo de exibição: Mapa Urbano 3D Isométrico vs. Gabinete Fiscal
  const [visaoPrincipal, setVisaoPrincipal] = useState<'MAPA' | 'GABINETE'>('MAPA');
  const [abaGabinete, setAbaGabinete] = useState<'FISCAL' | 'PLANEJAMENTO' | 'HISTORICO'>('FISCAL');
  const [overlay, setOverlay] = useState<TipoOverlay>('NORMAL');

  // Seleções no Mapa Urbano
  const [obraSelecionada, setObraSelecionada] = useState<ItemCatalogoConstrucao | undefined>();
  const [tileSelecionado, setTileSelecionado] = useState<TileData | undefined>();
  const [notificacao, setNotificacao] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);

  // Modais
  const [modalDecisoesAberto, setModalDecisoesAberto] = useState(false);

  const exibirNotificacao = (texto: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setNotificacao({ texto, tipo });
    setTimeout(() => setNotificacao(null), 4500);
  };

  // Avançar mês/turno
  const handleAvancarMes = () => {
    const novoEstado = engine.avancarMes();
    setEstado(novoEstado);
    // Se o tile selecionado mudou após simulação orgânica, atualiza
    if (tileSelecionado) {
      setTileSelecionado(gridManager.getTile(tileSelecionado.x, tileSelecionado.y));
    }
    exibirNotificacao(`Turno avançado para ${novoEstado.mesAtual}º mês de ${novoEstado.anoExercicio}! Crescimento privado atualizado.`);
  };

  // Executar decisão política
  const handleExecutarDecisao = (decisao: DecisaoPolitica) => {
    const novoEstado = engine.aplicarDecisao(decisao);
    setEstado(novoEstado);
    exibirNotificacao(`Decreto municipal promulgado: ${decisao.titulo}`);
  };

  // Ação de clique em um tile do mapa isométrico
  const handleTileClick = (x: number, y: number) => {
    if (obraSelecionada) {
      // Tentativa de licitação e construção
      const resultado = engine.licitarEConstruir(x, y, obraSelecionada);
      if (resultado.sucesso) {
        setEstado(engine.getEstado());
        setTileSelecionado(gridManager.getTile(x, y));
        
        // Feedback visual detalhado com os trade-offs
        const folhaMsg = obraSelecionada.folhaAnual > 0 ? ` | +${formatarMoeda(obraSelecionada.folhaAnual)}/ano Folha` : '';
        exibirNotificacao(
          `🏗️ ${obraSelecionada.nome} inaugurada! -${formatarMoeda(obraSelecionada.custoCapital)} Capital | +${formatarMoeda(obraSelecionada.custeioAnual)}/ano Custeio${folhaMsg}`,
          'sucesso'
        );

        if (obraSelecionada.categoria !== 'INFRAESTRUTURA') {
          setObraSelecionada(undefined);
        }
      } else {
        exibirNotificacao(resultado.motivo || 'Construção não permitida neste local.', 'erro');
      }
    } else {
      // Seleção normal de informações do lote
      const tile = gridManager.getTile(x, y);
      setTileSelecionado(tile);
    }
  };

  // Demolição de lote
  const handleDemolir = (x: number, y: number) => {
    const demoliu = engine.demolirLote(x, y);
    if (demoliu) {
      setEstado(engine.getEstado());
      setTileSelecionado(gridManager.getTile(x, y));
      exibirNotificacao('Lote desapropriado com sucesso.');
    }
  };

  const margemLivre = estado.balancoFiscalAnual.margemInvestimento.saldoLivreInvestimento;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Botão Flutuante de Alternância Rápida: Mapa vs. Gabinete */}
      <ViewSwitcher
        visaoAtual={visaoPrincipal}
        onAlternar={(novaVisao) => {
          setVisaoPrincipal(novaVisao);
          setObraSelecionada(undefined);
        }}
      />

      {/* Notificação Toast Flutuante */}
      {notificacao && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 transition-all animate-in fade-in slide-in-from-top-4 border ${
            notificacao.tipo === 'sucesso'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{notificacao.texto}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. VISÃO DO MAPA URBANO ISOMÉTRICO (SIMCITY STYLE)                        */}
      {/* ========================================================================= */}
      {visaoPrincipal === 'MAPA' && (
        <div className="relative w-full h-screen overflow-hidden flex flex-col bg-slate-950">
          {/* HUD Superior Flutuante na Visão do Mapa */}
          <div className="absolute top-3 left-3 right-3 sm:right-auto z-30 pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl pointer-events-auto flex items-center flex-wrap gap-2 sm:gap-4 max-w-full">
              {/* Nome da Cidade e Mês */}
              <div>
                <h1 className="font-extrabold text-xs sm:text-sm text-white tracking-tight flex items-center gap-1.5">
                  <span>{estado.cidade.nome}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-normal">
                    Ano {estado.anoMandato}º
                  </span>
                </h1>
                <p className="text-[10px] text-emerald-400 font-medium">
                  Mês {estado.mesAtual} / {estado.anoExercicio}
                </p>
              </div>

              {/* Caixa do Tesouro */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700/60">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-semibold">Caixa</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {formatarMoeda(estado.cidade.caixaTesouro)}
                  </span>
                </div>
              </div>

              {/* População e Aprovação */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700/60 hidden sm:flex">
                <Users className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-semibold">População</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {estado.cidade.populacao.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Botão de Avanço de Turno Rápido */}
              <button
                onClick={handleAvancarMes}
                className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center gap-1 active:scale-95 transition-all"
              >
                <span>Avançar Mês</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dica de Construção quando há obra selecionada */}
          {obraSelecionada && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <div className="bg-blue-900/90 backdrop-blur-md border border-blue-400/50 rounded-full px-4 py-1.5 text-xs font-bold text-blue-200 shadow-xl flex items-center gap-2 animate-pulse">
                <HardHat className="w-4 h-4 text-amber-400" />
                <span>Toque em um lote válido (com rua conectada) para construir: {obraSelecionada.nome}</span>
              </div>
            </div>
          )}

          {/* Controles de Camadas Temáticas (Overlays Analíticos) */}
          <OverlayControls
            overlayAtual={overlay}
            onSelecionarOverlay={setOverlay}
          />

          {/* Viewport PixiJS Interativo */}
          <div className="flex-1 w-full h-full">
            <IsometricViewport
              gridManager={gridManager}
              obraSelecionada={obraSelecionada}
              tileSelecionado={tileSelecionado}
              overlay={overlay}
              onTileClick={handleTileClick}
              margemInvestimentoSuficiente={(obra) => margemLivre >= obra.custoCapital}
            />
          </div>

          {/* Barra Horizontal Inferior de Obras Públicas */}
          <ConstructionBar
            obraSelecionada={obraSelecionada}
            onSelecionarObra={(obra) => {
              setObraSelecionada(obra);
              if (obra) setTileSelecionado(undefined);
            }}
            margemInvestimentoDisponivel={margemLivre}
          />

          {/* Gaveta Retrátil de Detalhes do Lote */}
          <TileDetailSheet
            tile={tileSelecionado}
            onFechar={() => setTileSelecionado(undefined)}
            onDemolir={handleDemolir}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VISÃO DO GABINETE FISCAL E PLANEJAMENTO (DASHBOARD & LRF)               */}
      {/* ========================================================================= */}
      {visaoPrincipal === 'GABINETE' && (
        <div className="flex-1 flex flex-col">
          <HeaderPrefeito
            estado={estado}
            onAvancarMes={handleAvancarMes}
            onAbrirDecisoes={() => setModalDecisoesAberto(true)}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
            <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/50 border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Gabinete de Finanças e Planejamento Municipal
                  </h2>
                  <p className="text-xs text-slate-300">
                    Acompanhe o reflexo das obras construídas no mapa sobre a LRF, os pisos de 15% e 25% e a LOA.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  Exercício: {estado.anoExercicio} (Ano {estado.anoMandato}º do PPA)
                </span>
              </div>
            </div>

            {/* Abas do Gabinete */}
            <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setAbaGabinete('FISCAL')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  abaGabinete === 'FISCAL'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Motor Fiscal & Limites LRF</span>
              </button>

              <button
                onClick={() => setAbaGabinete('PLANEJAMENTO')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  abaGabinete === 'PLANEJAMENTO'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Planejamento (PPA & LOA)</span>
              </button>

              <button
                onClick={() => setAbaGabinete('HISTORICO')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  abaGabinete === 'HISTORICO'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Execução Mensal ({estado.historicoMensal.length} meses)</span>
              </button>
            </div>

            {abaGabinete === 'FISCAL' && (
              <div className="space-y-6">
                <FiscalDashboard balanco={estado.balancoFiscalAnual} />
                <ControleInternoAlertas alertas={estado.alertasAtivos} />
              </div>
            )}

            {abaGabinete === 'PLANEJAMENTO' && (
              <div className="space-y-6">
                <PlanningView
                  ppa={estado.ppa}
                  loa={estado.loa}
                  anoMandato={estado.anoMandato}
                />
              </div>
            )}

            {abaGabinete === 'HISTORICO' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-white">Diário de Execução Financeira Mensal</h3>
                {estado.historicoMensal.length === 0 ? (
                  <p className="text-xs text-slate-500">Nenhum mês finalizado ainda.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-800/70 text-slate-400 border-b border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">Mês/Ano</th>
                          <th className="py-2.5 px-3">Arrecadação</th>
                          <th className="py-2.5 px-3">Folha Pessoal</th>
                          <th className="py-2.5 px-3">Saúde</th>
                          <th className="py-2.5 px-3">Educação</th>
                          <th className="py-2.5 px-3">Investimentos</th>
                          <th className="py-2.5 px-3 text-right">Resultado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono">
                        {estado.historicoMensal.map((hist, i) => (
                          <tr key={i} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">
                              Mês {hist.mes} / {hist.ano}
                            </td>
                            <td className="py-2.5 px-3 text-emerald-400">{formatarMoeda(hist.receitaArrecadada)}</td>
                            <td className="py-2.5 px-3 text-slate-300">{formatarMoeda(hist.despesaPessoal)}</td>
                            <td className="py-2.5 px-3 text-slate-300">{formatarMoeda(hist.despesaSaude)}</td>
                            <td className="py-2.5 px-3 text-slate-300">{formatarMoeda(hist.despesaEducacao)}</td>
                            <td className="py-2.5 px-3 text-blue-400">{formatarMoeda(hist.despesaInvestimento)}</td>
                            <td className={`py-2.5 px-3 text-right font-bold ${hist.saldoMensal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {hist.saldoMensal >= 0 ? '+' : ''}{formatarMoeda(hist.saldoMensal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {/* Modal de Decisões do Prefeito */}
      <DecisoesModal
        aberto={modalDecisoesAberto}
        onFechar={() => setModalDecisoesAberto(false)}
        onExecutarDecisao={handleExecutarDecisao}
        caixaDisponivel={estado.cidade.caixaTesouro}
      />
    </div>
  );
};

export default App;
