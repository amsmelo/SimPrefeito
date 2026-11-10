import { describe, it, expect } from 'vitest';
import { GridManager } from '../engine/city/gridManager';
import { PrivateGrowthEngine } from '../engine/city/privateGrowthEngine';
import { BuildingCatalogManager } from '../engine/city/buildingCatalog';

describe('Motor de Crescimento Privado Autônomo e Impacto Fiscal', () => {
  it('deve calcular arrecadação de IPTU e ISS proporcional ao parque edificado privado', () => {
    const grid = new GridManager(24);
    const tributos = PrivateGrowthEngine.calcularArrecadacaoTributosPrivados(grid);

    expect(tributos.iptuTotal).toBeGreaterThan(0);
    expect(tributos.issTotal).toBeGreaterThan(0);
  });

  it('deve evoluir uma casa popular para sobrado residencial quando atendida por serviços públicos', () => {
    const grid = new GridManager(24);

    // Prepara lote em (3, 3) com rua e casa popular
    grid.construir(3, 4, 'rua-pavimentada');
    grid.construir(3, 3, 'casa-popular');

    const tile = grid.getTile(3, 3)!;
    tile.nivelSaude = 80;
    tile.nivelEducacao = 80;
    tile.nivelSaneamento = 80;

    // Executa múltiplos ciclos para vencer a probabilidade
    let evoluiu = false;
    for (let ciclo = 0; ciclo < 20; ciclo++) {
      PrivateGrowthEngine.simularCiclo(grid, 2025);
      if (tile.construcaoId === 'sobrado-residencial' || tile.construcaoId === 'edificio-residencial') {
        evoluiu = true;
        break;
      }
    }

    expect(evoluiu).toBe(true);
  });

  it('deve degradar lote residencial para cortiço se a área for abandonada sem saneamento e saúde', () => {
    const grid = new GridManager(24);

    // Constrói casa popular com acesso viário
    grid.construir(4, 5, 'rua-pavimentada');
    grid.construir(4, 4, 'casa-popular');
    const tile = grid.getTile(4, 4)!;
    expect(tile.construcaoId).toBe('casa-popular');

    // Simula abandono pelo poder público (demolição de acesso, queda crítica de saúde e saneamento)
    grid.demolir(4, 5);
    tile.conectadoRua = false;
    tile.nivelSaude = 5;
    tile.nivelSaneamento = 5;

    // Executa ciclos para vencer a probabilidade de degradação
    let degradou = false;
    for (let ciclo = 0; ciclo < 30; ciclo++) {
      PrivateGrowthEngine.simularCiclo(grid, 2025);
      if (tile.construcaoId === 'cortico-degradado') {
        degradou = true;
        break;
      }
    }

    expect(degradou).toBe(true);
    expect(tile.tierPrivado).toBe('DEGRADADO');
  });

  it('deve regenerar cortiço de volta para residência quando a prefeitura levar saneamento e rua', () => {
    const grid = new GridManager(24);

    grid.construir(5, 5, 'rua-pavimentada');
    const tile = grid.getTile(5, 4)!;
    tile.construcaoId = 'cortico-degradado';
    tile.construcao = BuildingCatalogManager.buscarPorId('cortico-degradado');
    tile.conectadoRua = true;
    tile.nivelSaneamento = 60;
    tile.nivelSaude = 60;

    PrivateGrowthEngine.simularCiclo(grid, 2025);
    expect(tile.construcaoId).toBe('casa-popular');
    expect(tile.tierPrivado).toBe(1);
  });
});
