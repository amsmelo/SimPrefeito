import { PPA, LOA, DotacaoLOA } from '../../types/planning';

export class LOAManager {
  /**
   * Gera a Lei Orçamentária Anual (LOA) anualizada diretamente a partir dos programas do PPA
   */
  public static gerarLOAApartirDoPPA(
    ppa: PPA,
    anoExercicio: number,
    anoPPA: 1 | 2 | 3 | 4,
    receitaEstimada: number
  ): LOA {
    const dotacoes: DotacaoLOA[] = [];

    let orcamentoFiscal = 0;
    let orcamentoSeguridadeSocial = 0;
    let despesaFixadaTotal = 0;

    ppa.programas.forEach((prog, progIndex) => {
      prog.acoes.forEach((acao) => {
        // Dotacao derivada proporcionalmente da meta financeira anual do programa
        const proporcaoAcao = acao.custoAnual;
        const valorOrcado = Number(proporcaoAcao.toFixed(2));

        // Determinação das fontes de recursos conforme a área de atuação
        let fonteRecurso: DotacaoLOA['fonteRecurso'] = 'LIVRE';
        if (acao.setor === 'SAUDE') {
          fonteRecurso = 'SAUDE_15';
        } else if (acao.setor === 'EDUCACAO') {
          fonteRecurso = acao.titulo.includes('Fundeb') ? 'FUNDEB' : 'EDUCACAO_25';
        }

        // Grupo de natureza da despesa
        const grupoNatureza: DotacaoLOA['grupoNatureza'] =
          acao.natureza === 'CAPITAL'
            ? 'INVESTIMENTOS'
            : acao.titulo.toLowerCase().includes('manutenção') || acao.titulo.toLowerCase().includes('folha')
            ? 'PESSOAL'
            : 'OUTRAS_DESPESAS_CORRENTES';

        const dotacao: DotacaoLOA = {
          id: `dot-${anoExercicio}-${prog.codigo}-${acao.codigoAcao}`,
          programaId: prog.id,
          programaNome: prog.nome,
          acaoId: acao.id,
          acaoTitulo: acao.titulo,
          setor: acao.setor,
          codigoDotacao: `0${progIndex + 1}.122.000${progIndex + 1}.${acao.codigoAcao}`,
          tipoAcao: acao.tipo,
          categoriaEconomica: acao.natureza === 'CAPITAL' ? 'DESPESAS_DE_CAPITAL' : 'DESPESAS_CORRENTES',
          grupoNatureza,
          fonteRecurso,
          valorOrcado,
          valorEmpenhado: 0,
          valorLiquidado: 0,
          valorPago: 0,
        };

        dotacoes.push(dotacao);
        despesaFixadaTotal += valorOrcado;

        // Classificação entre Orçamento Fiscal e Seguridade Social (CF/88 Art. 165)
        if (acao.setor === 'SAUDE' || acao.setor === 'ASSISTENCIA_SOCIAL') {
          orcamentoSeguridadeSocial += valorOrcado;
        } else {
          orcamentoFiscal += valorOrcado;
        }
      });
    });

    return {
      id: `loa-${anoExercicio}`,
      anoExercicio,
      anoPPA,
      ppaId: ppa.id,
      receitaEstimada: Number(receitaEstimada.toFixed(2)),
      despesaFixada: Number(despesaFixadaTotal.toFixed(2)),
      orcamentoFiscal: Number(orcamentoFiscal.toFixed(2)),
      orcamentoSeguridadeSocial: Number(orcamentoSeguridadeSocial.toFixed(2)),
      dotacoes,
      status: 'APROVADA',
    };
  }

  /**
   * Executa os estágios da despesa orçamentária: Empenho -> Liquidação -> Pagamento
   * (Lei Federal nº 4.320/1964)
   */
  public static executarDotacao(
    loa: LOA,
    dotacaoId: string,
    estagio: 'EMPENHAR' | 'LIQUIDAR' | 'PAGAR',
    valor: number
  ): LOA {
    const dotacoesAtualizadas = loa.dotacoes.map((dot) => {
      if (dot.id !== dotacaoId) return dot;

      const valorArredondado = Number(valor.toFixed(2));
      let novoEmpenhado = dot.valorEmpenhado;
      let novoLiquidado = dot.valorLiquidado;
      let novoPago = dot.valorPago;

      if (estagio === 'EMPENHAR') {
        const saldoDisponivel = dot.valorOrcado - dot.valorEmpenhado;
        const aEmpenhar = Math.min(saldoDisponivel, valorArredondado);
        novoEmpenhado = Number((dot.valorEmpenhado + aEmpenhar).toFixed(2));
      } else if (estagio === 'LIQUIDAR') {
        const saldoEmpenhadoNaoLiquidado = dot.valorEmpenhado - dot.valorLiquidado;
        const aLiquidar = Math.min(saldoEmpenhadoNaoLiquidado, valorArredondado);
        novoLiquidado = Number((dot.valorLiquidado + aLiquidar).toFixed(2));
      } else if (estagio === 'PAGAR') {
        const saldoLiquidadoNaoPago = dot.valorLiquidado - dot.valorPago;
        const aPagar = Math.min(saldoLiquidadoNaoPago, valorArredondado);
        novoPago = Number((dot.valorPago + aPagar).toFixed(2));
      }

      return {
        ...dot,
        valorEmpenhado: novoEmpenhado,
        valorLiquidado: novoLiquidado,
        valorPago: novoPago,
      };
    });

    return {
      ...loa,
      dotacoes: dotacoesAtualizadas,
      status: 'EM_EXECUCAO',
    };
  }
}
