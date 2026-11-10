/**
 * Tipagens do Módulo Urbano Isométrico, Catálogo de Obras e Crescimento Privado
 */

export type TipoTerreno = 'GRAMA' | 'AGUA' | 'TERRA';

export type CategoriaConstrucao = 
  | 'INFRAESTRUTURA'
  | 'SAUDE'
  | 'EDUCACAO'
  | 'SANEAMENTO'
  | 'LAZER'
  | 'ADMINISTRATIVO'
  | 'RESIDENCIAL'
  | 'COMERCIAL'
  | 'INDUSTRIAL';

export type TierPrivado = 1 | 2 | 3 | 'DEGRADADO';

export type TipoOverlay = 'NORMAL' | 'SAUDE' | 'EDUCACAO' | 'VALOR_VENAL' | 'SANEAMENTO';

export interface ItemCatalogoConstrucao {
  id: string;
  nome: string;
  descricao: string;
  categoria: CategoriaConstrucao;
  /** Custo de Capital (despesa de investimento da LOA) */
  custoCapital: number;
  /** Custo anual de custeio/manutenção gerado */
  custeioAnual: number;
  /** Despesa anual com servidores/folha necessária */
  folhaAnual: number;
  /** Raio de influência/atendimento em tiles */
  raioInfluencia: number;
  /** Impacto percentual nas métricas locais */
  impactoSaude?: number;
  impactoEducacao?: number;
  impactoSaneamento?: number;
  impactoAtratividade?: number;
  impactoFelicidade?: number;
  /** Código da Ação do PPA vinculada */
  codigoAcaoPPA?: string;
  setorVinculado?: 'SAUDE' | 'EDUCACAO' | 'INFRAESTRUTURA' | 'ADMINISTRACAO';
  corPrimaria: number;
  corSecundaria: number;
  iconeNome: string;
  alturaPrismatica: number;
  requerConexaoRua: boolean;
  tier?: TierPrivado;
}

export interface FloatingTextEffect {
  id: string;
  x: number;
  y: number;
  texto: string;
  cor: number;
  tempoVida: number; // segundos restantes
  deslocamentoY: number;
}

export interface TileData {
  x: number;
  y: number;
  terreno: TipoTerreno;
  variacaoTerreno: number; // 0, 1, 2 para textura
  construcaoId?: string;
  construcao?: ItemCatalogoConstrucao;
  anoConstrucao?: number;
  populacaoAtendida?: number;
  conectadoRua: boolean;
  // Tier de evolução para edifícios privados
  tierPrivado?: TierPrivado;
  // Indicadores de qualidade local do lote (0 a 100)
  nivelSaude: number;
  nivelEducacao: number;
  nivelSaneamento: number;
  nivelAtratividade: number;
  valorVenalIPTU: number;
  // Timestamp de construção para micro-animação de poeira/subida
  timestampConstrucao?: number;
}

export interface MetricasUrbanaCalculadas {
  populacaoTotal: number;
  densidadeMedia: number;
  coberturaSaudePercentual: number;
  coberturaEducacaoPercentual: number;
  coberturaSaneamentoPercentual: number;
  eficienciaMobilidadePercentual: number;
  qualidadeVidaGeral: number;
  potencialArrecadacaoIPTU: number;
  potencialArrecadacaoISS: number;
  totalResidencialTier1: number;
  totalResidencialTier2: number;
  totalResidencialTier3: number;
  totalComercialTier1: number;
  totalComercialTier2: number;
  totalComercialTier3: number;
  totalIndustrial: number;
  totalCorticosDegradados: number;
}
