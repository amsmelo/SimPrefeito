import {
  ReceitasTributarias,
  Transferencias,
  DeducoesReceita,
  CalculoReceitaResultado,
} from '../../types/fiscal';

export class ReceitasManager {
  /**
   * Percentual padrão de contribuição dos municípios para o Fundeb (20%)
   * incidente sobre FPM, Cota-Parte ICMS, Cota-Parte IPVA, ITR e IPI-Exportação.
   */
  public static readonly PERCENTUAL_DEDUCAO_FUNDEB = 0.20;

  /**
   * Calcula a retenção padrão de 20% para formação do Fundeb
   */
  public static calcularRetencaoFundebPadrao(transferencias: Transferencias): number {
    const fpm = transferencias.fpm || 0;
    const icms = transferencias.cotaParteIcms || 0;
    const ipva = transferencias.cotaParteIpva || 0;
    const itr = transferencias.cotaParteItr || 0;
    const ipiExp = transferencias.cotaParteIpiExportacao || 0;

    const baseDeducaoFundeb = fpm + icms + ipva + itr + ipiExp;
    return Number((baseDeducaoFundeb * ReceitasManager.PERCENTUAL_DEDUCAO_FUNDEB).toFixed(2));
  }

  /**
   * Calcula a Base de Cálculo Constitucional (CF/88 Art. 198 e Art. 212)
   * Compreende os impostos municipais próprios + transferências constitucionais de impostos.
   */
  public static calcularBaseConstitucional(
    tributos: ReceitasTributarias,
    transferencias: Transferencias
  ): number {
    // Impostos municipais (art. 156 da CF/88): IPTU + ISS + ITBI
    // Nota: Taxas não entram na base de cálculo dos 15% e 25% (CF restringe a impostos)
    const impostosProprios = (tributos.iptu || 0) + (tributos.iss || 0) + (tributos.itbi || 0);

    // Cota-partes de impostos federais e estaduais (art. 158 e 159 da CF/88)
    const transferenciasConstitucionaisImpostos =
      (transferencias.fpm || 0) +
      (transferencias.cotaParteIcms || 0) +
      (transferencias.cotaParteIpva || 0) +
      (transferencias.cotaParteItr || 0) +
      (transferencias.cotaParteIpiExportacao || 0);

    return Number((impostosProprios + transferenciasConstitucionaisImpostos).toFixed(2));
  }

  /**
   * Realiza a apuração completa das receitas correntes e da Receita Corrente Líquida (RCL)
   * segundo o Art. 2º, inciso IV da Lei de Responsabilidade Fiscal.
   */
  public static calcularRCL(
    tributos: ReceitasTributarias,
    transferencias: Transferencias,
    deducoesPersonalizadas?: Partial<DeducoesReceita>
  ): CalculoReceitaResultado {
    // 1. Total de Tributos Arrecadados
    const totalTributario =
      (tributos.iptu || 0) +
      (tributos.iss || 0) +
      (tributos.itbi || 0) +
      (tributos.taxas || 0) +
      (tributos.cosip || 0);

    // 2. Total de Transferências Correntes
    const totalTransferencias =
      (transferencias.fpm || 0) +
      (transferencias.cotaParteIcms || 0) +
      (transferencias.cotaParteIpva || 0) +
      (transferencias.fundeb || 0) +
      (transferencias.cotaParteItr || 0) +
      (transferencias.cotaParteIpiExportacao || 0) +
      (transferencias.transferenciasSus || 0) +
      (transferencias.outrasTransferencias || 0);

    // Receita Corrente Bruta
    const receitaCorrenteBruta = Number((totalTributario + totalTransferencias).toFixed(2));

    // 3. Deduções da Receita
    // Se não for fornecida dedução personalizada de Fundeb, calcula a legal de 20%
    const retencaoFundeb =
      deducoesPersonalizadas?.retencaoFundeb !== undefined
        ? deducoesPersonalizadas.retencaoFundeb
        : ReceitasManager.calcularRetencaoFundebPadrao(transferencias);

    const previdenciarias = deducoesPersonalizadas?.contribuicoesPrevidenciarias || 0;
    const renuncias = deducoesPersonalizadas?.renunciasERestituicoes || 0;

    const totalDeducoes = Number((retencaoFundeb + previdenciarias + renuncias).toFixed(2));

    // 4. Receita Corrente Líquida (RCL) = Receitas Correntes - Deduções
    const rcl = Math.max(0, Number((receitaCorrenteBruta - totalDeducoes).toFixed(2)));

    // 5. Base Constitucional para Mínimos Obrigatórios (CF art. 198 e 212)
    const baseCalculoConstitucional = ReceitasManager.calcularBaseConstitucional(
      tributos,
      transferencias
    );

    const deducoes: DeducoesReceita = {
      retencaoFundeb,
      contribuicoesPrevidenciarias: previdenciarias,
      renunciasERestituicoes: renuncias,
    };

    return {
      receitasTributarias: { ...tributos },
      transferencias: { ...transferencias },
      deducoes,
      receitaCorrenteBruta,
      totalDeducoes,
      rcl,
      baseCalculoConstitucional,
    };
  }
}
