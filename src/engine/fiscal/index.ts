import {
  ReceitasTributarias,
  Transferencias,
  DeducoesReceita,
  BalancoFiscalCompleto,
} from '../../types/fiscal';
import { ReceitasManager } from './receitas';
import { DespesaPessoalManager, ParametrosDespesaPessoal } from './despesaPessoal';
import { VinculacoesManager } from './vinculacoes';
import { CusteioManager, ParametrosCusteio } from './custeioOperacional';
import { MargemInvestimentoManager } from './margemInvestimento';

export * from '../../types/fiscal';
export {
  ReceitasManager,
  DespesaPessoalManager,
  VinculacoesManager,
  CusteioManager,
  MargemInvestimentoManager,
};

export interface DadosOrcamentariosAno {
  tributos: ReceitasTributarias;
  transferencias: Transferencias;
  deducoesPersonalizadas?: Partial<DeducoesReceita>;
  despesaPessoal: ParametrosDespesaPessoal;
  custeio: ParametrosCusteio;
  gastoEfetivoSaude: number;
  gastoEfetivoEducacao: number;
  servicoDivida?: number;
  outrasReceitasCapital?: number;
}

/**
 * Motor Fiscal Central (Headless)
 * Integra e valida todos os fluxos fiscais de acordo com a legislação brasileira.
 */
export class FiscalEngine {
  /**
   * Executa a apuração orçamentária e fiscal completa do município
   */
  public static calcularBalancoCompleto(dados: DadosOrcamentariosAno): BalancoFiscalCompleto {
    // 1. Apuração de Receitas e RCL
    const receitas = ReceitasManager.calcularRCL(
      dados.tributos,
      dados.transferencias,
      dados.deducoesPersonalizadas
    );

    // 2. Apuração da Despesa com Pessoal (Limites LRF 48.6%, 51.3%, 54.0%)
    const despesaPessoal = DespesaPessoalManager.calcularDespesaPessoal(
      dados.despesaPessoal,
      receitas.rcl
    );

    // 3. Verificação dos Pisos Constitucionais (Saúde 15%, Educação 25%)
    const vinculacoes = VinculacoesManager.calcularVinculacoesObrigatorias(
      receitas.baseCalculoConstitucional,
      dados.gastoEfetivoSaude,
      dados.gastoEfetivoEducacao
    );

    // 4. Consolidação do Custeio Operacional
    const custeio = CusteioManager.calcularCusteio(dados.custeio);

    // 5. Determinação da Margem Líquida para Investimentos de Capital
    const margemInvestimento = MargemInvestimentoManager.calcularMargem({
      rcl: receitas.rcl,
      despesaPessoalLiquida: despesaPessoal.despesaTotalPessoalLiquida,
      custeioTotal: custeio.total,
      servicoDivida: dados.servicoDivida,
      outrasReceitasCapital: dados.outrasReceitasCapital,
    });

    return {
      receitas,
      despesaPessoal,
      vinculacoes,
      custeio,
      margemInvestimento,
    };
  }

  /**
   * Emite diagnósticos e parecer do órgão de controle interno / Tribunal de Contas
   */
  public static gerarParecerControleInterno(balanco: BalancoFiscalCompleto): string[] {
    const apontamentos: string[] = [];

    // Limites de Pessoal
    switch (balanco.despesaPessoal.statusLRF) {
      case 'EXCEDIDO':
        apontamentos.push(
          `🔴 CRÍTICO - LRF Art. 20: Despesa com Pessoal em ${balanco.despesaPessoal.percentualSobreRCL}% ultrapassa o Limite Máximo de 54,00%. Contas sujeitas a rejeição pelo TCE/TCM.`
        );
        break;
      case 'PRUDENCIAL':
        apontamentos.push(
          `🟠 ATENÇÃO - LRF Art. 22: Despesa com Pessoal em ${balanco.despesaPessoal.percentualSobreRCL}% atingiu o Limite Prudencial (51,30%). Vedações administrativas ativadas.`
        );
        break;
      case 'ALERTA':
        apontamentos.push(
          `🟡 ALERTA - LRF Art. 59: Despesa com Pessoal em ${balanco.despesaPessoal.percentualSobreRCL}% superou o Limite de Alerta (48,60%). Recomenda-se contenção de novas despesas.`
        );
        break;
      default:
        apontamentos.push(
          `🟢 REGULAR - Despesa com pessoal enquadrada dentro dos limites seguros da LRF (${balanco.despesaPessoal.percentualSobreRCL}% da RCL).`
        );
    }

    // Mínimo de Saúde
    if (balanco.vinculacoes.saude.cumprido) {
      apontamentos.push(
        `🟢 REGULAR - Mínimo da Saúde cumprido: ${balanco.vinculacoes.saude.percentualAtingido}% aplicados (mínimo 15,00%). Superávit de R$ ${balanco.vinculacoes.saude.diferenca.toLocaleString('pt-BR')}.`
      );
    } else {
      apontamentos.push(
        `🔴 ILEGALIDADE - Mínimo da Saúde NÃO atingido: apenas ${balanco.vinculacoes.saude.percentualAtingido}% aplicados. Déficit de R$ ${Math.abs(balanco.vinculacoes.saude.diferenca).toLocaleString('pt-BR')} sujeita o gestor a improbidade administrativa.`
      );
    }

    // Mínimo de Educação
    if (balanco.vinculacoes.educacao.cumprido) {
      apontamentos.push(
        `🟢 REGULAR - Mínimo da Educação cumprido: ${balanco.vinculacoes.educacao.percentualAtingido}% aplicados (mínimo 25,00%). Superávit de R$ ${balanco.vinculacoes.educacao.diferenca.toLocaleString('pt-BR')}.`
      );
    } else {
      apontamentos.push(
        `🔴 ILEGALIDADE - Mínimo da Educação NÃO atingido: apenas ${balanco.vinculacoes.educacao.percentualAtingido}% aplicados. Déficit de R$ ${Math.abs(balanco.vinculacoes.educacao.diferenca).toLocaleString('pt-BR')}. Motivo de rejeição de contas.`
      );
    }

    // Margem de Investimentos
    if (balanco.margemInvestimento.saldoLivreInvestimento <= 0) {
      apontamentos.push(
        `🔴 ALERTA FISCAL - Rigidez orçamentária crítica: Despesas correntes engolem 100% da RCL. Cidade sem capacidade própria para novos investimentos.`
      );
    } else {
      apontamentos.push(
        `🔵 INVESTIMENTOS - Capacidade de Investimento: ${balanco.margemInvestimento.capacidadeInvestimento} (Margem livre: R$ ${balanco.margemInvestimento.saldoLivreInvestimento.toLocaleString('pt-BR')}).`
      );
    }

    return apontamentos;
  }
}
