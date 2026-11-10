import { describe, it, expect } from 'vitest';
import { PPAManager, LOAManager, LDOManager } from '../engine/planning';

describe('Modelo de Planejamento Governamental - PPA, LDO e LOA', () => {
  it('deve instanciar um PPA de 4 anos com programas temáticos e metas físicas e financeiras', () => {
    const ppa = PPAManager.criarPPAPadrao(2025, 'Vila Rica');

    expect(ppa.anoInicio).toBe(2025);
    expect(ppa.anoFim).toBe(2028); // 4 anos
    expect(ppa.programas.length).toBeGreaterThanOrEqual(4);

    const progSaude = ppa.programas.find((p) => p.setor === 'SAUDE');
    const progEduc = ppa.programas.find((p) => p.setor === 'EDUCACAO');
    const progInfra = ppa.programas.find((p) => p.setor === 'INFRAESTRUTURA');

    expect(progSaude).toBeDefined();
    expect(progEduc).toBeDefined();
    expect(progInfra).toBeDefined();

    // Valida metas quadrienais e distribuição anual
    expect(progSaude!.metasFisicas[0].metasAnuais).toHaveLength(4);
    expect(progSaude!.metaFinanceira.previsaoAnual).toHaveLength(4);
  });

  it('deve gerar a LOA anualizada derivada diretamente dos programas do PPA', () => {
    const ppa = PPAManager.criarPPAPadrao(2025, 'Vila Rica');
    const loaAno1 = LOAManager.gerarLOAApartirDoPPA(ppa, 2025, 1, 120_000_000);

    expect(loaAno1.anoExercicio).toBe(2025);
    expect(loaAno1.anoPPA).toBe(1);
    expect(loaAno1.ppaId).toBe(ppa.id);

    // Deve segregar Orçamento Fiscal e da Seguridade Social
    expect(loaAno1.orcamentoFiscal).toBeGreaterThan(0);
    expect(loaAno1.orcamentoSeguridadeSocial).toBeGreaterThan(0);
    expect(loaAno1.despesaFixada).toBe(loaAno1.orcamentoFiscal + loaAno1.orcamentoSeguridadeSocial);

    // Validação das dotações orçamentárias
    expect(loaAno1.dotacoes.length).toBeGreaterThan(0);
    const dotacaoSaude = loaAno1.dotacoes.find((d) => d.fonteRecurso === 'SAUDE_15');
    expect(dotacaoSaude).toBeDefined();
    expect(dotacaoSaude!.valorEmpenhado).toBe(0);
  });

  it('deve executar os estágios da despesa na LOA (Empenho -> Liquidação -> Pagamento)', () => {
    const ppa = PPAManager.criarPPAPadrao(2025, 'Vila Rica');
    let loa = LOAManager.gerarLOAApartirDoPPA(ppa, 2025, 1, 100_000_000);
    const dotacaoId = loa.dotacoes[0].id;
    const valorOriginalOrcado = loa.dotacoes[0].valorOrcado;

    // 1. Estágio de Empenho
    loa = LOAManager.executarDotacao(loa, dotacaoId, 'EMPENHAR', 100_000);
    let dot = loa.dotacoes.find((d) => d.id === dotacaoId)!;
    expect(dot.valorEmpenhado).toBe(Math.min(valorOriginalOrcado, 100_000));
    expect(dot.valorLiquidado).toBe(0);

    // 2. Estágio de Liquidação (não pode ultrapassar o empenhado)
    loa = LOAManager.executarDotacao(loa, dotacaoId, 'LIQUIDAR', 80_000);
    dot = loa.dotacoes.find((d) => d.id === dotacaoId)!;
    expect(dot.valorLiquidado).toBe(80_000);
    expect(dot.valorPago).toBe(0);

    // 3. Estágio de Pagamento (não pode ultrapassar o liquidado)
    loa = LOAManager.executarDotacao(loa, dotacaoId, 'PAGAR', 50_000);
    dot = loa.dotacoes.find((d) => d.id === dotacaoId)!;
    expect(dot.valorPago).toBe(50_000);
  });

  it('deve criar a LDO anual com metas fiscais e prioridades articuladas ao PPA', () => {
    const ldo = LDOManager.criarLDO(2025, 1, 100_000_000);
    expect(ldo.metaRCL).toBe(100_000_000);
    expect(ldo.metaResultadoPrimario).toBe(2_000_000); // 2% da RCL
    expect(ldo.tetoDespesaPessoal).toBe(51.30); // Limite prudencial
    expect(ldo.prioridades.length).toBeGreaterThanOrEqual(3);
  });
});
