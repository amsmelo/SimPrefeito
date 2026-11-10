import { describe, it, expect } from 'vitest';
import { GridManager } from '../engine/city/gridManager';
import { CityMetricsCalculator } from '../engine/city/cityMetrics';
import { BuildingCatalogManager } from '../engine/city/buildingCatalog';
import { SimulationEngine } from '../engine/simulation/simulationEngine';

describe('Módulo Urbano Isométrico e Catálogo de Obras Públicas', () => {
  describe('1. Matemática de Projeção Isométrica 2:1', () => {
    it('deve converter coordenadas do grid para tela e reverter com isoToGrid com precisão', () => {
      const tileWidth = 64;
      const tileHeight = 32;

      // Ponto de teste: x = 5, y = 8
      const { screenX, screenY } = GridManager.gridToIso(5, 8, tileWidth, tileHeight);
      expect(screenX).toBe((5 - 8) * 32); // -96
      expect(screenY).toBe((5 + 8) * 16); // 208

      // Reversão no centro do tile
      const reversao = GridManager.isoToGrid(screenX, screenY, tileWidth, tileHeight);
      expect(reversao.x).toBe(5);
      expect(reversao.y).toBe(8);
    });
  });

  describe('2. Gestão da Grade e Regras Urbanísticas', () => {
    it('deve inicializar o grid 24x24 com centro cívico e rio sinuoso', () => {
      const grid = new GridManager(24);
      expect(grid.tamanho).toBe(24);

      // Palácio da Cidade deve estar posicionado
      const prefeitura = grid.getTile(11, 10);
      expect(prefeitura?.construcaoId).toBe('prefeitura-historica');

      // Verifica presença de água no mapa
      let encontrouAgua = false;
      for (let y = 0; y < 24; y++) {
        for (let x = 0; x < 24; x++) {
          if (grid.getTile(x, y)?.terreno === 'AGUA') {
            encontrouAgua = true;
            break;
          }
        }
      }
      expect(encontrouAgua).toBe(true);
    });

    it('deve exigir conexão viária contígua para edifícios públicos que requerem rua', () => {
      const grid = new GridManager(24);

      // (2, 2) está isolado no campo, sem rua contígua
      const ubs = BuildingCatalogManager.buscarPorId('ubs-tipo-1')!;
      const validacaoIsolada = grid.podeConstruir(2, 2, ubs.id);
      expect(validacaoIsolada.permitido).toBe(false);
      expect(validacaoIsolada.motivo).toContain('Requer conexão direta com rua');

      // Constrói rua em (2, 3)
      grid.construir(2, 3, 'rua-pavimentada');
      expect(grid.verificarConexaoRua(2, 2)).toBe(true);

      // Agora deve permitir construir a UBS em (2, 2)
      const validacaoComRua = grid.podeConstruir(2, 2, ubs.id);
      expect(validacaoComRua.permitido).toBe(true);
    });

    it('não deve permitir construir em terreno de preservação de água ou lote já ocupado', () => {
      const grid = new GridManager(24);
      const rua = BuildingCatalogManager.buscarPorId('rua-pavimentada')!;

      // Encontra tile de água
      let aguaX = -1;
      let aguaY = -1;
      for (let y = 0; y < 24; y++) {
        for (let x = 0; x < 24; x++) {
          if (grid.getTile(x, y)?.terreno === 'AGUA') {
            aguaX = x;
            aguaY = y;
            break;
          }
        }
        if (aguaX !== -1) break;
      }

      const validacaoAgua = grid.podeConstruir(aguaX, aguaY, rua.id);
      expect(validacaoAgua.permitido).toBe(false);
      expect(validacaoAgua.motivo).toContain('Área de preservação');

      // Tenta construir sobre a prefeitura existente
      const validacaoSobreposta = grid.podeConstruir(11, 10, rua.id);
      expect(validacaoSobreposta.permitido).toBe(false);
      expect(validacaoSobreposta.motivo).toContain('já ocupado');
    });
  });

  describe('3. Integração Fiscal e Obras Públicas com SimulationEngine', () => {
    it('deve licitar uma Creche Municipal debitando capital e aumentando folha e piso da educação', () => {
      const engine = new SimulationEngine('Cidade Teste', 2025);
      const grid = engine.getGridManager();

      // Encontra lote com rua disponível
      grid.construir(5, 5, 'rua-pavimentada');
      const creche = BuildingCatalogManager.buscarPorId('creche-municipal')!;

      const caixaAntes = engine.getEstado().cidade.caixaTesouro;
      const gastoEducAntes = engine.getEstado().balancoFiscalAnual.vinculacoes.educacao.valorAplicadoEfetivo;

      const res = engine.licitarEConstruir(5, 4, creche);
      expect(res.sucesso).toBe(true);

      const estadoDepois = engine.getEstado();
      // Caixa debitado pelo custo de capital (R$ 1.2M)
      expect(estadoDepois.cidade.caixaTesouro).toBe(Number((caixaAntes - creche.custoCapital).toFixed(2)));

      // Gasto em Educação deve aumentar incluindo o capital da obra + custeio
      expect(estadoDepois.balancoFiscalAnual.vinculacoes.educacao.valorAplicadoEfetivo).toBeGreaterThan(gastoEducAntes);

      // Folha de pessoal deve subir pela contratação de educadores (R$ 600k/ano)
      expect(estadoDepois.balancoFiscalAnual.despesaPessoal.despesaTotalPessoalBruta).toBeGreaterThan(0);
    });

    it('deve barrar obra se o custo de capital exceder o caixa disponível', () => {
      const engine = new SimulationEngine('Cidade Teste', 2025);
      const hospital = BuildingCatalogManager.buscarPorId('hospital-municipal')!;

      // Prepara lote livre com rua pavimentada
      engine.getGridManager().construir(8, 8, 'rua-pavimentada');

      // Simula caixa insuficiente (apenas R$ 100k, hospital custa 6M)
      engine.getEstado().cidade.caixaTesouro = 100_000;

      const res = engine.licitarEConstruir(8, 7, hospital);
      expect(res.sucesso).toBe(false);
      expect(res.motivo).toContain('Saldo insuficiente');
    });
  });

  describe('4. Métricas e Atratividade Urbana', () => {
    it('deve calcular métricas de qualidade de vida e potencial de tributos (IPTU/ISS)', () => {
      const grid = new GridManager(24);
      const metricas = CityMetricsCalculator.calcularMetricas(grid);

      expect(metricas.populacaoTotal).toBeGreaterThan(0);
      expect(metricas.coberturaSaudePercentual).toBeGreaterThan(0);
      expect(metricas.coberturaEducacaoPercentual).toBeGreaterThan(0);
      expect(metricas.potencialArrecadacaoIPTU).toBeGreaterThan(0);
      expect(metricas.potencialArrecadacaoISS).toBeGreaterThan(0);
    });
  });
});
