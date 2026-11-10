import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../engine/simulation/simulationEngine';

describe('Motor de Simulação de Turnos e Decisões Políticas', () => {
  it('deve inicializar o estado com mandato de 4 anos e balanço fiscal equilibrado', () => {
    const engine = new SimulationEngine('Cidade Sol', 2025);
    const estado = engine.getEstado();

    expect(estado.mesAtual).toBe(1);
    expect(estado.anoMandato).toBe(1);
    expect(estado.anoExercicio).toBe(2025);
    expect(estado.cidade.nome).toBe('Cidade Sol');
    expect(estado.cidade.caixaTesouro).toBeGreaterThan(0);
    expect(estado.balancoFiscalAnual.despesaPessoal.statusLRF).toBe('NORMAL');
  });

  it('deve avançar os meses corretamente e registrar histórico financeiro', () => {
    const engine = new SimulationEngine('Cidade Sol', 2025);

    // Avança mês 1 -> 2
    const estadoMes2 = engine.avancarMes();
    expect(estadoMes2.mesAtual).toBe(2);
    expect(estadoMes2.historicoMensal.length).toBe(1);

    const hist1 = estadoMes2.historicoMensal[0];
    expect(hist1.mes).toBe(1);
    expect(hist1.receitaArrecadada).toBeGreaterThan(0);
    expect(hist1.despesaLiquidada).toBeGreaterThan(0);
  });

  it('deve transitar de ano ao concluir o 12º mês do mandato', () => {
    const engine = new SimulationEngine('Cidade Sol', 2025);

    // Simula 12 meses
    for (let m = 1; m <= 12; m++) {
      engine.avancarMes();
    }

    const estadoAno2 = engine.getEstado();
    expect(estadoAno2.mesAtual).toBe(1);
    expect(estadoAno2.anoMandato).toBe(2);
    expect(estadoAno2.anoExercicio).toBe(2026);
    expect(estadoAno2.historicoMensal.length).toBe(12);
  });

  it('deve aplicar decisões do prefeito impactando folha de pessoal, receita e aprovação', () => {
    const engine = new SimulationEngine('Cidade Sol', 2025);
    const estadoAntes = engine.getEstado();

    // Aplica decisão de reajuste
    const estadoDepois = engine.aplicarDecisao({
      id: 'teste-reajuste',
      titulo: 'Reajuste Salarial',
      descricao: 'Aumento salarial geral',
      custoImediato: 0,
      impactoPessoalAnual: 3_000_000,
      impactoCusteioAnual: 0,
      impactoReceitaAnual: 0,
      impactoAprovacao: 5,
    });

    expect(estadoDepois.cidade.aprovacaoPrefeito).toBe(estadoAntes.cidade.aprovacaoPrefeito + 5);
    expect(estadoDepois.balancoFiscalAnual.despesaPessoal.despesaTotalPessoalLiquida).toBeGreaterThan(
      estadoAntes.balancoFiscalAnual.despesaPessoal.despesaTotalPessoalLiquida
    );
  });
});
