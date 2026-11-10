import { BalancoFiscalCompleto } from './fiscal';
import { LOA, PPA, LDO } from './planning';

export type MesDoAno = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface ExecucaoMensal {
  mes: MesDoAno;
  ano: number;
  receitaArrecadada: number;
  despesaLiquidada: number;
  despesaPessoal: number;
  despesaSaude: number;
  despesaEducacao: number;
  despesaInvestimento: number;
  saldoMensal: number;
}

export interface IndicadoresCidade {
  nome: string;
  populacao: number;
  indiceDesenvolvimentoUrbano: number; // 0 a 100
  qualidadeEducacao: number; // 0 a 100
  qualidadeSaude: number; // 0 a 100
  aprovacaoPrefeito: number; // 0 a 100
  caixaTesouro: number; // saldo financeiro em conta corrente
}

export interface DecisaoPolitica {
  id: string;
  titulo: string;
  descricao: string;
  custoImediato: number;
  impactoPessoalAnual: number;
  impactoCusteioAnual: number;
  impactoReceitaAnual: number;
  impactoAprovacao: number;
  setor?: string;
}

export interface EstadoSimulacao {
  mesAtual: MesDoAno;
  anoExercicio: number;
  anoMandato: 1 | 2 | 3 | 4;
  cidade: IndicadoresCidade;
  ppa: PPA;
  ldo: LDO;
  loa: LOA;
  balancoFiscalAnual: BalancoFiscalCompleto;
  historicoMensal: ExecucaoMensal[];
  alertasAtivos: string[];
  restricoesAtivas: string[];
}
