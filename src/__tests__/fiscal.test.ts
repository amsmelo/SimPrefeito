import { describe, it, expect } from 'vitest';
import {
  ReceitasManager,
  DespesaPessoalManager,
  VinculacoesManager,
  MargemInvestimentoManager,
  FiscalEngine,
} from '../engine/fiscal';
import { ReceitasTributarias, Transferencias } from '../types/fiscal';

describe('Motor Fiscal Municipal - Testes Unitários de Regras e LRF', () => {
  // Cenário base realista: Cidade de porte médio (150.000 hab.)
  const tributosBase: ReceitasTributarias = {
    iptu: 20_000_000,
    iss: 25_000_000,
    itbi: 5_000_000,
    taxas: 4_000_000,
    cosip: 2_000_000,
  };

  const transferenciasBase: Transferencias = {
    fpm: 35_000_000,
    cotaParteIcms: 30_000_000,
    cotaParteIpva: 12_000_000,
    fundeb: 22_000_000,
    cotaParteItr: 500_000,
    cotaParteIpiExportacao: 500_000,
    transferenciasSus: 8_000_000,
    outrasTransferencias: 3_000_000,
  };

  describe('1. Cálculo correto da Receita Corrente Líquida (RCL) e Deduções', () => {
    it('deve calcular a RCL corretamente deduzindo os 20% legais de contribuição ao Fundeb', () => {
      // Base de retenção Fundeb (FPM + ICMS + IPVA + ITR + IPI):
      // 35M + 30M + 12M + 0.5M + 0.5M = 78.000.000
      // 20% de 78M = 15.600.000
      const retencaoEsperada = 15_600_000;
      const retencaoCalculada = ReceitasManager.calcularRetencaoFundebPadrao(transferenciasBase);
      expect(retencaoCalculada).toBe(retencaoEsperada);

      // Total de Tributos: 20M + 25M + 5M + 4M + 2M = 56.000.000
      // Total de Transferências: 35M + 30M + 12M + 22M + 0.5M + 0.5M + 8M + 3M = 111.000.000
      // Receita Corrente Bruta = 56M + 111M = 167.000.000
      // RCL = Receita Bruta (167M) - Deduções Fundeb (15.6M) = 151.400.000
      const resultado = ReceitasManager.calcularRCL(tributosBase, transferenciasBase);

      expect(resultado.receitaCorrenteBruta).toBe(167_000_000);
      expect(resultado.totalDeducoes).toBe(15_600_000);
      expect(resultado.rcl).toBe(151_400_000);

      // Base Constitucional (Impostos próprios IPTU+ISS+ITBI = 50M + Transf. Constitucionais = 78M) = 128.000.000
      expect(resultado.baseCalculoConstitucional).toBe(128_000_000);
    });

    it('deve aceitar deduções customizadas de previdência e renúncias fiscais na RCL', () => {
      const resultado = ReceitasManager.calcularRCL(tributosBase, transferenciasBase, {
        retencaoFundeb: 15_600_000,
        contribuicoesPrevidenciarias: 1_400_000,
        renunciasERestituicoes: 400_000,
      });

      // Total deduções: 15.6M + 1.4M + 0.4M = 17.400.000
      // RCL: 167M - 17.4M = 149.600.000
      expect(resultado.totalDeducoes).toBe(17_400_000);
      expect(resultado.rcl).toBe(149_600_000);
    });
  });

  describe('2. Limites da Lei de Responsabilidade Fiscal para Despesa com Pessoal (Executivo)', () => {
    const rclExemplo = 100_000_000; // R$ 100 milhões para facilitar conferência percentual

    it('deve classificar como NORMAL quando abaixo do Limite de Alerta (<= 48,60%)', () => {
      const despesa = DespesaPessoalManager.calcularDespesaPessoal(
        {
          ativos: 40_000_000,
          inativosEPensionistas: 5_000_000,
          encargosSociais: 3_000_000, // Total = 48.000.000 (48.00%)
        },
        rclExemplo
      );

      expect(despesa.percentualSobreRCL).toBe(48.0);
      expect(despesa.statusLRF).toBe('NORMAL');
      expect(despesa.restricoesAtivas).toHaveLength(0);
    });

    it('deve emitir flag ALERTA quando entre 48,60% e 51,30%', () => {
      const despesa = DespesaPessoalManager.calcularDespesaPessoal(
        {
          ativos: 42_000_000,
          inativosEPensionistas: 5_000_000,
          encargosSociais: 3_000_000, // Total = 50.000.000 (50.00%)
        },
        rclExemplo
      );

      expect(despesa.percentualSobreRCL).toBe(50.0);
      expect(despesa.statusLRF).toBe('ALERTA');
      expect(despesa.restricoesAtivas.some((r) => r.includes('LIMITE DE ALERTA'))).toBe(true);
    });

    it('deve emitir flag PRUDENCIAL quando ultrapassa o Limite Prudencial (51,30% até 54,00%)', () => {
      const despesa = DespesaPessoalManager.calcularDespesaPessoal(
        {
          ativos: 44_000_000,
          inativosEPensionistas: 5_500_000,
          encargosSociais: 3_500_000, // Total = 53.000.000 (53.00%)
        },
        rclExemplo
      );

      expect(despesa.percentualSobreRCL).toBe(53.0);
      expect(despesa.statusLRF).toBe('PRUDENCIAL');
      // Deve conter restrições de proibição de reajustes e contratações
      expect(despesa.restricoesAtivas.some((r) => r.includes('LIMITE PRUDENCIAL ATINGIDO'))).toBe(true);
      expect(despesa.restricoesAtivas.some((r) => r.includes('Vedada a concessão de vantagem'))).toBe(true);
    });

    it('deve emitir flag EXCEDIDO quando ultrapassa o Limite Máximo legal de 54,00%', () => {
      const despesa = DespesaPessoalManager.calcularDespesaPessoal(
        {
          ativos: 46_000_000,
          inativosEPensionistas: 6_000_000,
          encargosSociais: 4_000_000, // Total = 56.000.000 (56.00%)
        },
        rclExemplo
      );

      expect(despesa.percentualSobreRCL).toBe(56.0);
      expect(despesa.statusLRF).toBe('EXCEDIDO');
      // Deve apontar violação grave e cortes obrigatórios da LRF Art. 23
      expect(despesa.restricoesAtivas.some((r) => r.includes('VIOLAÇÃO GRAVE DA LRF'))).toBe(true);
      expect(despesa.restricoesAtivas.some((r) => r.includes('Corte obrigatório de pelo menos 20%'))).toBe(true);
    });
  });

  describe('3. Cumprimento dos Mínimos Constitucionais de Saúde (15%) e Educação (25%)', () => {
    const baseConstitucional = 100_000_000; // R$ 100 milhões

    it('deve calcular e validar o piso da Saúde (15% da base de impostos)', () => {
      // Mínimo exigido = 15.000.000
      // Cenário A: Cumprimento acima do mínimo (R$ 17.500.000 -> 17.5%)
      const vinculacaoRegular = VinculacoesManager.calcularVinculacaoSaude(baseConstitucional, 17_500_000);
      expect(vinculacaoRegular.valorMinimoExigido).toBe(15_000_000);
      expect(vinculacaoRegular.percentualAtingido).toBe(17.5);
      expect(vinculacaoRegular.cumprido).toBe(true);
      expect(vinculacaoRegular.diferenca).toBe(2_500_000); // Superávit de 2.5M

      // Cenário B: Não cumprimento (R$ 13.000.000 -> 13.0%)
      const vinculacaoIrregular = VinculacoesManager.calcularVinculacaoSaude(baseConstitucional, 13_000_000);
      expect(vinculacaoIrregular.percentualAtingido).toBe(13.0);
      expect(vinculacaoIrregular.cumprido).toBe(false);
      expect(vinculacaoIrregular.diferenca).toBe(-2_000_000); // Déficit de 2M
    });

    it('deve calcular e validar o piso da Educação (25% da base de impostos)', () => {
      // Mínimo exigido = 25.000.000
      // Cenário A: Cumprimento (R$ 26.500.000 -> 26.5%)
      const vinculacaoRegular = VinculacoesManager.calcularVinculacaoEducacao(baseConstitucional, 26_500_000);
      expect(vinculacaoRegular.valorMinimoExigido).toBe(25_000_000);
      expect(vinculacaoRegular.percentualAtingido).toBe(26.5);
      expect(vinculacaoRegular.cumprido).toBe(true);
      expect(vinculacaoRegular.diferenca).toBe(1_500_000);

      // Cenário B: Não cumprimento (R$ 22.000.000 -> 22.0%)
      const vinculacaoIrregular = VinculacoesManager.calcularVinculacaoEducacao(baseConstitucional, 22_000_000);
      expect(vinculacaoIrregular.percentualAtingido).toBe(22.0);
      expect(vinculacaoIrregular.cumprido).toBe(false);
      expect(vinculacaoIrregular.diferenca).toBe(-3_000_000); // Déficit grave de 3M
    });

    it('deve consolidar o status de ambas as vinculações conjuntas', () => {
      const consolidado = VinculacoesManager.calcularVinculacoesObrigatorias(
        baseConstitucional,
        16_000_000, // 16% Saúde (cumprido)
        24_000_000  // 24% Educação (não cumprido)
      );

      expect(consolidado.saude.cumprido).toBe(true);
      expect(consolidado.educacao.cumprido).toBe(false);
      expect(consolidado.ambasCumpridas).toBe(false);
    });
  });

  describe('4. Cálculo da Margem Livre Líquida para Novos Investimentos de Capital', () => {
    it('deve calcular o saldo livre disponível subtraindo folha líquida e custeio da RCL', () => {
      const margem = MargemInvestimentoManager.calcularMargem({
        rcl: 100_000_000,
        despesaPessoalLiquida: 50_000_000,
        custeioTotal: 35_000_000,
        servicoDivida: 3_000_000,
        outrasReceitasCapital: 2_000_000, // Emenda ou operação de crédito não vinculada
      });

      // Total disponível = 100M + 2M = 102.000.000
      // Despesas Rígidas = 50M (pessoal) + 35M (custeio) + 3M (dívida) = 88.000.000
      // Saldo Livre = 102M - 88M = 14.000.000
      expect(margem.receitasTotaisDisponiveis).toBe(102_000_000);
      expect(margem.despesasRigidasTotais).toBe(88_000_000);
      expect(margem.saldoLivreInvestimento).toBe(14_000_000);
      expect(margem.percentualComprometimentoRigido).toBe(88.0);
      expect(margem.capacidadeInvestimento).toBe('MODERADA'); // 14% está entre 8% e 15%
    });

    it('deve detectar situação de insolvência/rigidez total quando o saldo for negativo', () => {
      const margem = MargemInvestimentoManager.calcularMargem({
        rcl: 100_000_000,
        despesaPessoalLiquida: 58_000_000,
        custeioTotal: 45_000_000,
      });

      // Despesas Rígidas = 103.000.000 > 100.000.000
      expect(margem.saldoLivreInvestimento).toBe(-3_000_000);
      expect(margem.capacidadeInvestimento).toBe('INSOLVENTE');
    });
  });

  describe('Integração Completa com FiscalEngine', () => {
    it('deve executar o cálculo completo e gerar parecer de controle interno consistente', () => {
      const balanco = FiscalEngine.calcularBalancoCompleto({
        tributos: tributosBase,
        transferencias: transferenciasBase,
        despesaPessoal: {
          ativos: 50_000_000,
          inativosEPensionistas: 12_000_000,
          encargosSociais: 10_000_000,
        },
        custeio: {
          manutencaoBensPublicos: 15_000_000,
          servicosEUtilidades: 18_000_000,
          materiaisConsumo: 12_000_000,
        },
        gastoEfetivoSaude: 22_000_000, // Base = 128M; 15% = 19.2M -> 22M é ~17.18% (Cumprido)
        gastoEfetivoEducacao: 33_000_000, // Base = 128M; 25% = 32M -> 33M é ~25.78% (Cumprido)
        servicoDivida: 2_000_000,
      });

      // RCL calculada = 151.400.000
      expect(balanco.receitas.rcl).toBe(151_400_000);

      // Despesa pessoal = 72.000.000 / 151.400.000 = 47.56% (NORMAL, abaixo de 48.60%)
      expect(balanco.despesaPessoal.percentualSobreRCL).toBe(47.56);
      expect(balanco.despesaPessoal.statusLRF).toBe('NORMAL');

      // Pisos
      expect(balanco.vinculacoes.saude.cumprido).toBe(true);
      expect(balanco.vinculacoes.educacao.cumprido).toBe(true);
      expect(balanco.vinculacoes.ambasCumpridas).toBe(true);

      // Margem
      // Despesas rígidas: 72M + 45M + 2M = 119M
      // Saldo Livre: 151.4M - 119M = 32.400.000
      expect(balanco.margemInvestimento.saldoLivreInvestimento).toBe(32_400_000);
      expect(balanco.margemInvestimento.capacidadeInvestimento).toBe('EXCELENTE');

      // Parecer emitido
      const parecer = FiscalEngine.gerarParecerControleInterno(balanco);
      expect(parecer.some((p) => p.includes('REGULAR - Despesa com pessoal enquadrada'))).toBe(true);
      expect(parecer.some((p) => p.includes('REGULAR - Mínimo da Saúde cumprido'))).toBe(true);
      expect(parecer.some((p) => p.includes('REGULAR - Mínimo da Educação cumprido'))).toBe(true);
      expect(parecer.some((p) => p.includes('EXCELENTE'))).toBe(true);
    });
  });
});
