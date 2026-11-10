import {
  DespesaPessoal,
  StatusLRF,
} from '../../types/fiscal';

export interface ParametrosDespesaPessoal {
  ativos: number;
  inativosEPensionistas?: number;
  encargosSociais?: number;
  outrasDespesasSubstituicao?: number;
  deducoesLegais?: number;
}

export class DespesaPessoalManager {
  // Limites da Lei de Responsabilidade Fiscal para o Poder Executivo Municipal (Art. 19 e 20)
  public static readonly PERCENTUAL_ALERTA = 48.60;
  public static readonly PERCENTUAL_PRUDENCIAL = 51.30;
  public static readonly PERCENTUAL_MAXIMO = 54.00;

  /**
   * Avalia a despesa total com pessoal frente à RCL e determina o enquadramento na LRF
   */
  public static calcularDespesaPessoal(
    params: ParametrosDespesaPessoal,
    rcl: number
  ): DespesaPessoal {
    const ativos = params.ativos || 0;
    const inativosEPensionistas = params.inativosEPensionistas || 0;
    const encargosSociais = params.encargosSociais || 0;
    const outrasDespesasSubstituicao = params.outrasDespesasSubstituicao || 0;
    const deducoesLegais = params.deducoesLegais || 0;

    const despesaTotalPessoalBruta = Number(
      (ativos + inativosEPensionistas + encargosSociais + outrasDespesasSubstituicao).toFixed(2)
    );

    const despesaTotalPessoalLiquida = Math.max(
      0,
      Number((despesaTotalPessoalBruta - deducoesLegais).toFixed(2))
    );

    const percentualSobreRCL = rcl > 0
      ? Number(((despesaTotalPessoalLiquida / rcl) * 100).toFixed(2))
      : 0;

    // Valores nominais dos limites com base na RCL
    const limiteAlertaValor = Number(((rcl * DespesaPessoalManager.PERCENTUAL_ALERTA) / 100).toFixed(2));
    const limitePrudencialValor = Number(((rcl * DespesaPessoalManager.PERCENTUAL_PRUDENCIAL) / 100).toFixed(2));
    const limiteMaximoValor = Number(((rcl * DespesaPessoalManager.PERCENTUAL_MAXIMO) / 100).toFixed(2));

    // Determina o status da LRF
    let statusLRF: StatusLRF = 'NORMAL';
    const restricoesAtivas: string[] = [];

    if (percentualSobreRCL > DespesaPessoalManager.PERCENTUAL_MAXIMO) {
      statusLRF = 'EXCEDIDO';
      restricoesAtivas.push(
        'VIOLAÇÃO GRAVE DA LRF (Art. 23): Limite máximo de 54% ultrapassado.',
        'Obrigatoriedade de eliminação do excesso nos 2 quadrimestres seguintes.',
        'Corte obrigatório de pelo menos 20% das despesas com cargos em comissão e funções de confiança.',
        'Exoneração de servidores não estáveis se o corte de comissionados não bastar.',
        'Suspensão total do recebimento de transferências voluntárias da União e Estado.',
        'Impedimento legal de contratar novas operações de crédito e obter garantias.'
      );
    } else if (percentualSobreRCL > DespesaPessoalManager.PERCENTUAL_PRUDENCIAL) {
      statusLRF = 'PRUDENCIAL';
      restricoesAtivas.push(
        'LIMITE PRUDENCIAL ATINGIDO (Art. 22, parágrafo único da LRF):',
        'Vedada a concessão de vantagem, aumento, reajuste ou adequação de remuneração a qualquer título.',
        'Vedada a criação de novos cargos, empregos ou funções.',
        'Vedada a alteração de estrutura de carreira que implique aumento de despesa.',
        'Vedado o provimento de cargo público e admissão de pessoal (ressalvada reposição em saúde, educação e segurança).',
        'Vedada a contratação de hora extra, ressalvadas situações de emergência.'
      );
    } else if (percentualSobreRCL > DespesaPessoalManager.PERCENTUAL_ALERTA) {
      statusLRF = 'ALERTA';
      restricoesAtivas.push(
        'LIMITE DE ALERTA ATINGIDO (Art. 59, § 1º, II da LRF):',
        'Notificação formal emitida pelo Tribunal de Contas do Estado.',
        'Recomendação preventiva de contenção da folha de pagamento.'
      );
    }

    return {
      ativos,
      inativosEPensionistas,
      encargosSociais,
      outrasDespesasSubstituicao,
      despesaTotalPessoalBruta,
      deducoesLegais,
      despesaTotalPessoalLiquida,
      percentualSobreRCL,
      statusLRF,
      limiteAlertaValor,
      limitePrudencialValor,
      limiteMaximoValor,
      restricoesAtivas,
    };
  }

  /**
   * Simula o novo percentual da folha caso seja concedido um reajuste percentual
   */
  public static simularReajusteSalarial(
    despesaAtual: DespesaPessoal,
    rcl: number,
    percentualReajuste: number
  ): DespesaPessoal {
    const fator = 1 + percentualReajuste / 100;
    return DespesaPessoalManager.calcularDespesaPessoal(
      {
        ativos: Number((despesaAtual.ativos * fator).toFixed(2)),
        inativosEPensionistas: Number((despesaAtual.inativosEPensionistas * fator).toFixed(2)),
        encargosSociais: Number((despesaAtual.encargosSociais * fator).toFixed(2)),
        outrasDespesasSubstituicao: despesaAtual.outrasDespesasSubstituicao,
        deducoesLegais: despesaAtual.deducoesLegais,
      },
      rcl
    );
  }
}
