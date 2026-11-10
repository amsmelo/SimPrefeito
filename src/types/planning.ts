/**
 * Tipagens do Modelo de Planejamento Governamental
 * PPA (Plano Plurianual), LDO (Lei de Diretrizes Orçamentárias) e LOA (Lei Orçamentária Anual).
 */

export type SetorGoverno = 
  | 'EDUCACAO'
  | 'SAUDE'
  | 'INFRAESTRUTURA'
  | 'ASSISTENCIA_SOCIAL'
  | 'ADMINISTRACAO'
  | 'SEGURANCA_URBANA'
  | 'MEIO_AMBIENTE';

export interface MetaFisica {
  id: string;
  indicador: string;
  unidadeMedida: string;
  /** Meta total acumulada para o quadriênio */
  metaQuadrienal: number;
  /** Metas parciais para cada um dos 4 anos do PPA [Ano 1, Ano 2, Ano 3, Ano 4] */
  metasAnuais: [number, number, number, number];
  /** Progresso físico executado por ano */
  executadoAnual: [number, number, number, number];
}

export interface MetaFinanceira {
  /** Custo total estimado do programa para os 4 anos */
  custoTotalPlurianual: number;
  /** Previsão orçamentária distribuída nos 4 anos [Ano 1, Ano 2, Ano 3, Ano 4] */
  previsaoAnual: [number, number, number, number];
  /** Despesas efetivamente liquidadas nos 4 anos */
  executadoAnual: [number, number, number, number];
}

export type TipoAcao = 'PROJETO' | 'ATIVIDADE' | 'OPERACAO_ESPECIAL';

export interface AcaoOrcamentaria {
  id: string;
  codigoAcao: string;
  titulo: string;
  descricao: string;
  tipo: TipoAcao;
  metaFisica?: MetaFisica;
  /** Custo estimado anual */
  custoAnual: number;
  /** Se conta como despesa de capital (investimento) ou corrente (custeio/pessoal) */
  natureza: 'CORRENTE' | 'CAPITAL';
  setor: SetorGoverno;
}

export interface ProgramaTematico {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  objetivoEstrategico: string;
  orgaoResponsavel: string;
  setor: SetorGoverno;
  metasFisicas: MetaFisica[];
  metaFinanceira: MetaFinanceira;
  acoes: AcaoOrcamentaria[];
}

export interface PPA {
  id: string;
  nome: string;
  anoInicio: number;
  anoFim: number; // Sempre anoInicio + 3 (4 anos)
  descricao: string;
  programas: ProgramaTematico[];
  /** Custo total somado de todos os programas */
  custoTotalQuadrienal: number;
}

export interface PrioridadeLDO {
  id: string;
  programaId: string;
  descricao: string;
  metaFiscalPrioritaria: string;
}

export interface LDO {
  anoExercicio: number;
  anoPPA: 1 | 2 | 3 | 4;
  /** Meta de Receita Corrente Líquida fixada */
  metaRCL: number;
  /** Meta de Superávit Primário para o exercício */
  metaResultadoPrimario: number;
  /** Teto de Gastos com Pessoal fixado (percentual da RCL) */
  tetoDespesaPessoal: number;
  /** Prioridades e metas da administração municipal para o ano */
  prioridades: PrioridadeLDO[];
  /** Riscos fiscais avaliados (contingências) */
  reservaContingencia: number;
}

export interface DotacaoLOA {
  id: string;
  programaId: string;
  programaNome: string;
  acaoId: string;
  acaoTitulo: string;
  setor: SetorGoverno;
  codigoDotacao: string; // ex.: 04.122.0001.2001
  tipoAcao: TipoAcao;
  categoriaEconomica: 'DESPESAS_CORRENTES' | 'DESPESAS_DE_CAPITAL';
  grupoNatureza: 'PESSOAL' | 'JUROS_DIVIDA' | 'OUTRAS_DESPESAS_CORRENTES' | 'INVESTIMENTOS' | 'INVERSOES_FINANCEIRAS' | 'AMORTIZACAO';
  fonteRecurso: 'LIVRE' | 'SAUDE_15' | 'EDUCACAO_25' | 'FUNDEB' | 'CONVENIOS' | 'OPERACOES_CREDITO';
  valorOrcado: number;
  valorEmpenhado: number;
  valorLiquidado: number;
  valorPago: number;
}

export interface LOA {
  id: string;
  anoExercicio: number;
  anoPPA: 1 | 2 | 3 | 4;
  ppaId: string;
  /** Estimativa total de receitas */
  receitaEstimada: number;
  /** Fixação total de despesas */
  despesaFixada: number;
  /** Subdivisão clássica da LOA */
  orcamentoFiscal: number;
  orcamentoSeguridadeSocial: number;
  /** Dotações detalhadas derivadas dos programas do PPA */
  dotacoes: DotacaoLOA[];
  /** Status legislativo */
  status: 'EM_ELABORACAO' | 'ENVIADA_CAMARA' | 'APROVADA' | 'EM_EXECUCAO';
}
