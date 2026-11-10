/**
 * Tipagens do Motor Fiscal - Finanças Públicas Municipais Brasileiras
 * Em conformidade com a LRF (Lei Complementar nº 101/2000), CF/88 e Lei 4.320/1964.
 */

export interface ReceitasTributarias {
  /** Imposto Predial e Territorial Urbano */
  iptu: number;
  /** Imposto Sobre Serviços de Qualquer Natureza */
  iss: number;
  /** Imposto sobre a Transmissão de Bens Imóveis */
  itbi: number;
  /** Taxas de Poder de Polícia e Serviços (ex.: alvará, coleta) */
  taxas: number;
  /** Contribuição para Custeio do Serviço de Iluminação Pública */
  cosip?: number;
}

export interface Transferencias {
  /** Fundo de Participação dos Municípios (CF, art. 159, I, b) */
  fpm: number;
  /** Cota-Parte do ICMS estadual pertencente ao município (25%) */
  cotaParteIcms: number;
  /** Cota-Parte do IPVA estadual pertencente ao município (50%) */
  cotaParteIpva: number;
  /** Recursos recebidos do Fundeb (retorno + complementação União/Estado) */
  fundeb: number;
  /** Cota-Parte do ITR (CF, art. 158, II) */
  cotaParteItr?: number;
  /** Cota-Parte IPI-Exportação (CF, art. 159, II e § 3º) */
  cotaParteIpiExportacao?: number;
  /** Transferências do SUS (Fundo a Fundo) */
  transferenciasSus?: number;
  /** Outras Transferências Correntes (convênios, FNAS, etc.) */
  outrasTransferencias?: number;
}

export interface DeducoesReceita {
  /** Retenção obrigatória de 20% para a formação do Fundeb sobre FPM, ICMS, IPVA, ITR e IPI */
  retencaoFundeb: number;
  /** Contribuição patronal/servidores para RPPS ou compensações previdenciárias */
  contribuicoesPrevidenciarias?: number;
  /** Renúncias, restituições e compensações tributárias */
  renunciasERestituicoes?: number;
}

export interface CalculoReceitaResultado {
  receitasTributarias: ReceitasTributarias;
  transferencias: Transferencias;
  deducoes: DeducoesReceita;
  /** Somatório de todas as receitas correntes brutas */
  receitaCorrenteBruta: number;
  /** Total de deduções legais aplicadas */
  totalDeducoes: number;
  /**
   * Receita Corrente Líquida (LRF, art. 2º, IV)
   * Base principal para limites da LRF (Pessoal, Dívida, Antecipação de Receita).
   */
  rcl: number;
  /**
   * Base de Cálculo Constitucional para Mínimos de Saúde e Educação:
   * Impostos próprios (IPTU + ISS + ITBI) + Cota-partes constitucionais (FPM, ICMS, IPVA, ITR, IPI-Exp).
   */
  baseCalculoConstitucional: number;
}

export type StatusLRF = 
  | 'NORMAL'      // <= 48.60% (dentro dos limites seguros)
  | 'ALERTA'      // > 48.60% e <= 51.30% (notificação do Tribunal de Contas)
  | 'PRUDENCIAL'  // > 51.30% e <= 54.00% (proibição de reajustes, horas extras e contratações)
  | 'EXCEDIDO';   // > 54.00% (violação grave; perda de repasses e sanções ao prefeito)

export interface LimitesLRFPessoal {
  readonly PERCENTUAL_ALERTA: 48.60;
  readonly PERCENTUAL_PRUDENCIAL: 51.30;
  readonly PERCENTUAL_MAXIMO: 54.00;
}

export interface DespesaPessoal {
  /** Folha de pagamento dos servidores ativos (salários base, gratificações) */
  ativos: number;
  /** Aposentadorias e pensões pagas pelo tesouro */
  inativosEPensionistas: number;
  /** Encargos patronais sociais (INSS/RPPS) */
  encargosSociais: number;
  /** Outras despesas de pessoal decorrentes de terceirização (art. 18, § 1º da LRF) */
  outrasDespesasSubstituicao: number;
  /** Despesa Total com Pessoal bruta */
  despesaTotalPessoalBruta: number;
  /** Deduções admitidas pela LRF (indenizações de demissão, incentivos à demissão voluntária) */
  deducoesLegais: number;
  /** Despesa Total com Pessoal (DTP) Líquida */
  despesaTotalPessoalLiquida: number;
  /** Percentual da DTP sobre a Receita Corrente Líquida */
  percentualSobreRCL: number;
  /** Enquadramento na LRF */
  statusLRF: StatusLRF;
  /** Valores nominais dos limites para a RCL atual */
  limiteAlertaValor: number;
  limitePrudencialValor: number;
  limiteMaximoValor: number;
  /** Restrições legais atualmente ativas decorrentes do limite */
  restricoesAtivas: string[];
}

export interface VinculacaoSetorial {
  setor: 'SAUDE' | 'EDUCACAO';
  /** 15% para Saúde, 25% para Educação */
  percentualMinimoObrigatorio: number;
  /** Base de cálculo dos impostos e transferências constitucionais */
  baseCalculo: number;
  /** Valor nominal mínimo exigido no exercício */
  valorMinimoExigido: number;
  /** Valor efetivamente liquidado/aplicado */
  valorAplicadoEfetivo: number;
  /** Percentual efetivo atingido sobre a base */
  percentualAtingido: number;
  /** Se o piso constitucional foi atendido */
  cumprido: boolean;
  /** Saldo (positivo = superávit em relação ao piso; negativo = déficit a cumprir) */
  diferenca: number;
}

export interface VinculacoesObrigatorias {
  saude: VinculacaoSetorial;
  educacao: VinculacaoSetorial;
  /** Indicador sintético se ambos os pisos foram satisfeitos */
  ambasCumpridas: boolean;
}

export interface CusteioOperacional {
  /** Manutenção predial, equipamentos e maquinário público */
  manutencaoBensPublicos: number;
  /** Serviços de terceiros e utilidades (água, energia, comunicações) */
  servicosEUtilidades: number;
  /** Insumos de consumo contínuo (combustíveis, merenda, medicamentos da rede) */
  materiaisConsumo: number;
  /** Demais despesas correntes de funcionamento da máquina */
  outrosCusteios: number;
  /** Total de custeio corrente */
  total: number;
}

export interface MargemInvestimento {
  /** Receita total líquida disponível */
  receitasTotaisDisponiveis: number;
  /** Somatório das despesas rígidas (Pessoal + Custeio Mínimo + Encargos) */
  despesasRigidasTotais: number;
  /**
   * Saldo livre para despesas de capital (investimentos em novas obras e equipamentos)
   * Capacidade própria de investimento do município.
   */
  saldoLivreInvestimento: number;
  /** Percentual da receita comprometido com a máquina pública */
  percentualComprometimentoRigido: number;
  /** Avaliação da saúde fiscal para investimentos */
  capacidadeInvestimento: 'EXCELENTE' | 'MODERADA' | 'RESTRITA' | 'INSOLVENTE';
}

export interface BalancoFiscalCompleto {
  receitas: CalculoReceitaResultado;
  despesaPessoal: DespesaPessoal;
  vinculacoes: VinculacoesObrigatorias;
  custeio: CusteioOperacional;
  margemInvestimento: MargemInvestimento;
}
