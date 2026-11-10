import { LDO } from '../../types/planning';

export class LDOManager {
  /**
   * Cria as diretrizes orçamentárias anuais em consonância com o PPA e LRF
   */
  public static criarLDO(anoExercicio: number, anoPPA: 1 | 2 | 3 | 4, metaRCL: number): LDO {
    return {
      anoExercicio,
      anoPPA,
      metaRCL,
      metaResultadoPrimario: Number((metaRCL * 0.02).toFixed(2)), // Meta de superávit de 2% da RCL
      tetoDespesaPessoal: 51.30, // Limite prudencial como teto operacional
      reservaContingencia: Number((metaRCL * 0.015).toFixed(2)), // 1.5% para riscos fiscais imprevistos
      prioridades: [
        {
          id: 'prio-1',
          programaId: 'prog-saude',
          descricao: 'Ampliação da cobertura vacinal e reforma de postos de saúde de atenção primária.',
          metaFiscalPrioritaria: 'Garantir aplicação mínima de 16,0% (acima do piso constitucional de 15%).',
        },
        {
          id: 'prio-2',
          programaId: 'prog-educacao',
          descricao: 'Entrega de novos leitos de creche e capacitação continuada do corpo docente.',
          metaFiscalPrioritaria: 'Cumprimento estrito de no mínimo 25,0% em MDE e pagamento do piso salarial dos professores.',
        },
        {
          id: 'prio-3',
          programaId: 'prog-infraestrutura',
          descricao: 'Pavimentação asfáltica estruturante e desassoreamento de córregos antes do período chuvoso.',
          metaFiscalPrioritaria: 'Priorização de obras com recursos próprios e contrapartidas estaduais.',
        },
      ],
    };
  }
}
