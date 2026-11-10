import {
  EstadoSimulacao,
  ExecucaoMensal,
  DecisaoPolitica,
  MesDoAno,
} from '../../types/simulation';
import { FiscalEngine, DadosOrcamentariosAno } from '../fiscal';
import { PPAManager } from '../planning/ppaManager';
import { LOAManager } from '../planning/loaManager';
import { LDOManager } from '../planning/ldoManager';
import { GridManager } from '../city/gridManager';
import { CityMetricsCalculator } from '../city/cityMetrics';
import { ItemCatalogoConstrucao } from '../../types/city';

export class SimulationEngine {
  private estado: EstadoSimulacao;
  private gridManager: GridManager;

  constructor(nomeCidade: string = 'Vila Esperança', anoInicio: number = 2025) {
    this.gridManager = new GridManager();
    this.estado = this.inicializarEstado(nomeCidade, anoInicio);
    this.sincronizarMetricasDaCidade();
  }

  public getEstado(): EstadoSimulacao {
    return { ...this.estado };
  }

  public getGridManager(): GridManager {
    return this.gridManager;
  }

  private inicializarEstado(nomeCidade: string, anoInicio: number): EstadoSimulacao {
    const ppa = PPAManager.criarPPAPadrao(anoInicio, nomeCidade);
    const anoMandato = 1;
    const anoExercicio = anoInicio;

    const receitaEstimada = 100_000_000;
    const ldo = LDOManager.criarLDO(anoExercicio, anoMandato, receitaEstimada);
    const loa = LOAManager.gerarLOAApartirDoPPA(ppa, anoExercicio, anoMandato, receitaEstimada);

    const dadosIniciais: DadosOrcamentariosAno = {
      tributos: {
        iptu: 14_000_000,
        iss: 18_000_000,
        itbi: 4_500_000,
        taxas: 3_500_000,
        cosip: 2_000_000,
      },
      transferencias: {
        fpm: 28_000_000,
        cotaParteIcms: 22_000_000,
        cotaParteIpva: 9_000_000,
        fundeb: 16_000_000,
        cotaParteItr: 500_000,
        cotaParteIpiExportacao: 800_000,
        transferenciasSus: 7_200_000,
      },
      despesaPessoal: {
        ativos: 36_000_000,
        inativosEPensionistas: 6_000_000,
        encargosSociais: 6_800_000,
      },
      custeio: {
        manutencaoBensPublicos: 7_000_000,
        servicosEUtilidades: 8_500_000,
        materiaisConsumo: 6_500_000,
        outrosCusteios: 2_000_000,
      },
      gastoEfetivoSaude: 16_200_000,
      gastoEfetivoEducacao: 25_000_000,
      servicoDivida: 1_200_000,
    };

    const balancoFiscalAnual = FiscalEngine.calcularBalancoCompleto(dadosIniciais);
    const alertas = FiscalEngine.gerarParecerControleInterno(balancoFiscalAnual);

    return {
      mesAtual: 1,
      anoExercicio,
      anoMandato,
      cidade: {
        nome: nomeCidade,
        populacao: 125000,
        indiceDesenvolvimentoUrbano: 68,
        qualidadeEducacao: 65,
        qualidadeSaude: 62,
        aprovacaoPrefeito: 58,
        caixaTesouro: 8_500_000,
      },
      ppa,
      ldo,
      loa,
      balancoFiscalAnual,
      historicoMensal: [],
      alertasAtivos: alertas,
      restricoesAtivas: balancoFiscalAnual.despesaPessoal.restricoesAtivas,
    };
  }

  /**
   * Sincroniza métricas da malha urbana com os indicadores do jogo e orçamento
   */
  public sincronizarMetricasDaCidade(): void {
    const metricas = CityMetricsCalculator.calcularMetricas(this.gridManager);

    // Ajusta dinamicamente a arrecadação de IPTU e ISS na receita anual conforme a expansão privada
    const balanco = this.estado.balancoFiscalAnual;
    const novosTributos = {
      ...balanco.receitas.receitasTributarias,
      iptu: 14_000_000 + metricas.potencialArrecadacaoIPTU,
      iss: 18_000_000 + metricas.potencialArrecadacaoISS,
    };

    const novoBalanco = FiscalEngine.calcularBalancoCompleto({
      tributos: novosTributos,
      transferencias: balanco.receitas.transferencias,
      despesaPessoal: balanco.despesaPessoal,
      custeio: balanco.custeio,
      gastoEfetivoSaude: balanco.vinculacoes.saude.valorAplicadoEfetivo,
      gastoEfetivoEducacao: balanco.vinculacoes.educacao.valorAplicadoEfetivo,
    });

    this.estado = {
      ...this.estado,
      balancoFiscalAnual: novoBalanco,
      alertasAtivos: FiscalEngine.gerarParecerControleInterno(novoBalanco),
      cidade: {
        ...this.estado.cidade,
        populacao: 120_000 + metricas.populacaoTotal * 8,
        qualidadeSaude: metricas.coberturaSaudePercentual,
        qualidadeEducacao: metricas.coberturaEducacaoPercentual,
        indiceDesenvolvimentoUrbano: metricas.qualidadeVidaGeral,
      },
    };
  }

  /**
   * Licitação e Assentamento de Obra Pública na Malha Urbana Isométrica
   */
  public licitarEConstruir(
    x: number,
    y: number,
    obra: ItemCatalogoConstrucao
  ): { sucesso: boolean; motivo?: string } {
    // 1. Valida se o terreno e regras urbanísticas permitem
    const validacaoTerreno = this.gridManager.podeConstruir(x, y, obra.id);
    if (!validacaoTerreno.permitido) {
      return { sucesso: false, motivo: validacaoTerreno.motivo };
    }

    // 2. Valida se há Margem Livre de Investimentos (Despesas de Capital) e Caixa
    const margemLivre = this.estado.balancoFiscalAnual.margemInvestimento.saldoLivreInvestimento;
    const caixa = this.estado.cidade.caixaTesouro;

    if (obra.custoCapital > caixa) {
      return { sucesso: false, motivo: 'Saldo insuficiente no Caixa do Tesouro' };
    }

    if (obra.custoCapital > margemLivre && margemLivre > 0) {
      return { sucesso: false, motivo: 'Despesa de Capital ultrapassa a Margem Livre da LOA' };
    }

    // 3. Constrói no Grid Isométrico
    const construiu = this.gridManager.construir(x, y, obra.id, this.estado.anoExercicio);
    if (!construiu) {
      return { sucesso: false, motivo: 'Falha ao assentar construção no lote' };
    }

    const tileConstruido = this.gridManager.getTile(x, y);
    if (tileConstruido) {
      tileConstruido.timestampConstrucao = performance.now();
    }

    // 4. Aplica os impactos fiscais permanentes de Folha e Custeio
    const balanco = this.estado.balancoFiscalAnual;

    const novaFolha = {
      ...balanco.despesaPessoal,
      ativos: balanco.despesaPessoal.ativos + obra.folhaAnual,
      encargosSociais: balanco.despesaPessoal.encargosSociais + obra.folhaAnual * 0.22,
    };

    const novoCusteio = {
      ...balanco.custeio,
      manutencaoBensPublicos: balanco.custeio.manutencaoBensPublicos + obra.custeioAnual,
    };

    const novoGastoSaude =
      balanco.vinculacoes.saude.valorAplicadoEfetivo +
      (obra.setorVinculado === 'SAUDE' ? obra.custoCapital + obra.custeioAnual : 0);

    const novoGastoEducacao =
      balanco.vinculacoes.educacao.valorAplicadoEfetivo +
      (obra.setorVinculado === 'EDUCACAO' ? obra.custoCapital + obra.custeioAnual : 0);

    const novoBalanco = FiscalEngine.calcularBalancoCompleto({
      tributos: balanco.receitas.receitasTributarias,
      transferencias: balanco.receitas.transferencias,
      despesaPessoal: novaFolha,
      custeio: novoCusteio,
      gastoEfetivoSaude: novoGastoSaude,
      gastoEfetivoEducacao: novoGastoEducacao,
    });

    const novoCaixa = Number((caixa - obra.custoCapital).toFixed(2));
    const deltaAprovacao = obra.impactoFelicidade ? Math.round(obra.impactoFelicidade / 4) : 2;
    const novaAprovacao = Math.min(100, this.estado.cidade.aprovacaoPrefeito + deltaAprovacao);

    // 5. Atualiza o PPA se houver ação correspondente
    let ppaAtualizado = this.estado.ppa;
    if (obra.setorVinculado) {
      const prog = ppaAtualizado.programas.find((p) => p.setor === obra.setorVinculado);
      if (prog) {
        ppaAtualizado = PPAManager.registrarProgresso(
          ppaAtualizado,
          prog.id,
          this.estado.anoMandato,
          1,
          obra.custoCapital
        );
      }
    }

    this.estado = {
      ...this.estado,
      balancoFiscalAnual: novoBalanco,
      alertasAtivos: FiscalEngine.gerarParecerControleInterno(novoBalanco),
      restricoesAtivas: novoBalanco.despesaPessoal.restricoesAtivas,
      ppa: ppaAtualizado,
      cidade: {
        ...this.estado.cidade,
        caixaTesouro: novoCaixa,
        aprovacaoPrefeito: novaAprovacao,
      },
    };

    this.sincronizarMetricasDaCidade();
    return { sucesso: true };
  }

  /**
   * Demolição ou desapropriação de um lote no grid
   */
  public demolirLote(x: number, y: number): boolean {
    const demoliu = this.gridManager.demolir(x, y);
    if (demoliu) {
      this.sincronizarMetricasDaCidade();
    }
    return demoliu;
  }

  /**
   * Avança um mês de mandato na simulação
   */
  public avancarMes(): EstadoSimulacao {
    // Crescimento orgânico de habitações e comércios no mapa
    this.gridManager.simularCrescimentoOrganico(this.estado.anoExercicio);
    this.sincronizarMetricasDaCidade();

    const { mesAtual, balancoFiscalAnual, cidade } = this.estado;

    let fatorReceita = 1.0;
    let fatorDespesaPessoal = 1.0;

    if (mesAtual === 1 || mesAtual === 2) {
      fatorReceita = 1.45;
    } else if (mesAtual === 11 || mesAtual === 12) {
      fatorDespesaPessoal = 1.5;
    }

    const receitaMensal = Number(
      ((balancoFiscalAnual.receitas.rcl / 12) * fatorReceita).toFixed(2)
    );

    const folhaMensal = Number(
      ((balancoFiscalAnual.despesaPessoal.despesaTotalPessoalLiquida / 12) * fatorDespesaPessoal).toFixed(2)
    );

    const custeioMensal = Number(
      (balancoFiscalAnual.custeio.total / 12).toFixed(2)
    );

    const saudeMensal = Number(
      (balancoFiscalAnual.vinculacoes.saude.valorAplicadoEfetivo / 12).toFixed(2)
    );

    const educacaoMensal = Number(
      (balancoFiscalAnual.vinculacoes.educacao.valorAplicadoEfetivo / 12).toFixed(2)
    );

    const investimentoMensal = Number(
      (Math.max(0, balancoFiscalAnual.margemInvestimento.saldoLivreInvestimento) / 12).toFixed(2)
    );

    const totalDespesaMensal = Number(
      (folhaMensal + custeioMensal + investimentoMensal).toFixed(2)
    );

    const saldoMensal = Number((receitaMensal - totalDespesaMensal).toFixed(2));
    const novoCaixa = Number((cidade.caixaTesouro + saldoMensal).toFixed(2));

    const registro: ExecucaoMensal = {
      mes: mesAtual,
      ano: this.estado.anoExercicio,
      receitaArrecadada: receitaMensal,
      despesaLiquidada: totalDespesaMensal,
      despesaPessoal: folhaMensal,
      despesaSaude: saudeMensal,
      despesaEducacao: educacaoMensal,
      despesaInvestimento: investimentoMensal,
      saldoMensal,
    };

    const novoHistorico = [...this.estado.historicoMensal, registro];

    if (mesAtual === 12) {
      return this.concluirAnoExercicio(novoHistorico, novoCaixa);
    }

    const proximoMes = (mesAtual + 1) as MesDoAno;
    this.estado = {
      ...this.estado,
      mesAtual: proximoMes,
      cidade: {
        ...this.estado.cidade,
        caixaTesouro: novoCaixa,
      },
      historicoMensal: novoHistorico,
    };

    return this.getEstado();
  }

  private concluirAnoExercicio(historico: ExecucaoMensal[], novoCaixa: number): EstadoSimulacao {
    const proximoAnoMandato = Math.min(4, this.estado.anoMandato + 1) as 1 | 2 | 3 | 4;
    const proximoAnoExercicio = this.estado.anoExercicio + 1;

    let ppaAtualizado = this.estado.ppa;
    ppaAtualizado.programas.forEach((prog) => {
      ppaAtualizado = PPAManager.registrarProgresso(
        ppaAtualizado,
        prog.id,
        this.estado.anoMandato,
        prog.metasFisicas[0]?.metasAnuais[this.estado.anoMandato - 1] || 1,
        prog.metaFinanceira.previsaoAnual[this.estado.anoMandato - 1] || 10000000
      );
    });

    const novaLDO = LDOManager.criarLDO(
      proximoAnoExercicio,
      proximoAnoMandato,
      this.estado.balancoFiscalAnual.receitas.rcl * 1.05
    );

    const novaLOA = LOAManager.gerarLOAApartirDoPPA(
      ppaAtualizado,
      proximoAnoExercicio,
      proximoAnoMandato,
      this.estado.balancoFiscalAnual.receitas.rcl * 1.05
    );

    let deltaAprovacao = 0;
    if (this.estado.balancoFiscalAnual.despesaPessoal.statusLRF === 'EXCEDIDO') {
      deltaAprovacao -= 15;
    } else if (this.estado.balancoFiscalAnual.despesaPessoal.statusLRF === 'NORMAL') {
      deltaAprovacao += 3;
    }

    if (this.estado.balancoFiscalAnual.vinculacoes.ambasCumpridas) {
      deltaAprovacao += 4;
    } else {
      deltaAprovacao -= 10;
    }

    const novaAprovacao = Math.min(100, Math.max(5, this.estado.cidade.aprovacaoPrefeito + deltaAprovacao));

    this.estado = {
      ...this.estado,
      mesAtual: 1,
      anoMandato: proximoAnoMandato,
      anoExercicio: proximoAnoExercicio,
      ppa: ppaAtualizado,
      ldo: novaLDO,
      loa: novaLOA,
      cidade: {
        ...this.estado.cidade,
        caixaTesouro: novoCaixa,
        aprovacaoPrefeito: novaAprovacao,
      },
      historicoMensal: historico,
    };

    return this.getEstado();
  }

  public aplicarDecisao(decisao: DecisaoPolitica): EstadoSimulacao {
    const balanco = this.estado.balancoFiscalAnual;

    const novosTributos = {
      ...balanco.receitas.receitasTributarias,
      iss: balanco.receitas.receitasTributarias.iss + decisao.impactoReceitaAnual,
    };

    const novaFolha = {
      ativos: balanco.despesaPessoal.ativos + decisao.impactoPessoalAnual,
      inativosEPensionistas: balanco.despesaPessoal.inativosEPensionistas,
      encargosSociais: balanco.despesaPessoal.encargosSociais + decisao.impactoPessoalAnual * 0.22,
    };

    const novoCusteio = {
      ...balanco.custeio,
      manutencaoBensPublicos: balanco.custeio.manutencaoBensPublicos + decisao.impactoCusteioAnual,
    };

    const novoBalanco = FiscalEngine.calcularBalancoCompleto({
      tributos: novosTributos,
      transferencias: balanco.receitas.transferencias,
      despesaPessoal: novaFolha,
      custeio: novoCusteio,
      gastoEfetivoSaude: balanco.vinculacoes.saude.valorAplicadoEfetivo + (decisao.setor === 'SAUDE' ? decisao.custoImediato : 0),
      gastoEfetivoEducacao: balanco.vinculacoes.educacao.valorAplicadoEfetivo + (decisao.setor === 'EDUCACAO' ? decisao.custoImediato : 0),
    });

    const novosAlertas = FiscalEngine.gerarParecerControleInterno(novoBalanco);
    const novoCaixa = this.estado.cidade.caixaTesouro - decisao.custoImediato;
    const novaAprovacao = Math.min(100, Math.max(0, this.estado.cidade.aprovacaoPrefeito + decisao.impactoAprovacao));

    this.estado = {
      ...this.estado,
      balancoFiscalAnual: novoBalanco,
      alertasAtivos: novosAlertas,
      restricoesAtivas: novoBalanco.despesaPessoal.restricoesAtivas,
      cidade: {
        ...this.estado.cidade,
        caixaTesouro: novoCaixa,
        aprovacaoPrefeito: novaAprovacao,
      },
    };

    return this.getEstado();
  }
}
