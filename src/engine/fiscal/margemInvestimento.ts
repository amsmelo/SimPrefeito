import { MargemInvestimento } from '../../types/fiscal';

export interface ParametrosMargemInvestimento {
  /** Receita Corrente Líquida disponível no exercício */
  rcl: number;
  /** Despesa Total com Pessoal Líquida */
  despesaPessoalLiquida: number;
  /** Custeio Operacional total da máquina */
  custeioTotal: number;
  /** Encargos da dívida pública / amortizações (se houver) */
  servicoDivida?: number;
  /** Receitas de capital não vinculadas já asseguradas (operações de crédito / emendas livres) */
  outrasReceitasCapital?: number;
}

export class MargemInvestimentoManager {
  /**
   * Calcula a margem líquida para Despesas de Capital (novos investimentos e obras)
   */
  public static calcularMargem(params: ParametrosMargemInvestimento): MargemInvestimento {
    const rcl = params.rcl || 0;
    const pessoal = params.despesaPessoalLiquida || 0;
    const custeio = params.custeioTotal || 0;
    const divida = params.servicoDivida || 0;
    const capitalExtra = params.outrasReceitasCapital || 0;

    const despesasRigidasTotais = Number((pessoal + custeio + divida).toFixed(2));
    const receitasTotaisDisponiveis = Number((rcl + capitalExtra).toFixed(2));

    const saldoLivreInvestimento = Number((receitasTotaisDisponiveis - despesasRigidasTotais).toFixed(2));

    const percentualComprometimentoRigido = rcl > 0
      ? Number(((despesasRigidasTotais / rcl) * 100).toFixed(2))
      : 100;

    // Avaliação da capacidade de investimento
    const percentualMargemSobreRCL = rcl > 0 ? (saldoLivreInvestimento / rcl) * 100 : 0;

    let capacidadeInvestimento: MargemInvestimento['capacidadeInvestimento'] = 'RESTRITA';

    if (saldoLivreInvestimento <= 0) {
      capacidadeInvestimento = 'INSOLVENTE';
    } else if (percentualMargemSobreRCL >= 15) {
      capacidadeInvestimento = 'EXCELENTE';
    } else if (percentualMargemSobreRCL >= 8) {
      capacidadeInvestimento = 'MODERADA';
    } else {
      capacidadeInvestimento = 'RESTRITA';
    }

    return {
      receitasTotaisDisponiveis,
      despesasRigidasTotais,
      saldoLivreInvestimento,
      percentualComprometimentoRigido,
      capacidadeInvestimento,
    };
  }
}
