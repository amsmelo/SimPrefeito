import { GridManager } from './gridManager';
import { BuildingCatalogManager } from './buildingCatalog';
import { TileData } from '../../types/city';

export interface RelatorioCrescimentoPrivado {
  novosPredios: number;
  upgradesTier: number;
  degradacoes: number;
  regeneracoes: number;
  arrecadacaoIPTUAdicional: number;
  arrecadacaoISSAdicional: number;
}

export class PrivateGrowthEngine {
  /**
   * Executa a rodada mensal de evolução, adensamento, degradação e cálculo fiscal do setor privado
   */
  public static simularCiclo(gridManager: GridManager, anoAtual: number): RelatorioCrescimentoPrivado {
    const grid = gridManager.getGrid();
    const tamanho = gridManager.tamanho;

    let novosPredios = 0;
    let upgradesTier = 0;
    let degradacoes = 0;
    let regeneracoes = 0;

    for (let y = 0; y < tamanho; y++) {
      for (let x = 0; x < tamanho; x++) {
        const tile = grid[y][x];

        // 1. Lotes Vazios -> Nova Ocupação
        if (tile.terreno === 'GRAMA' && !tile.construcaoId && tile.conectadoRua) {
          const resultado = this.avaliarNovoLote(gridManager, tile, x, y, anoAtual);
          if (resultado) novosPredios++;
          continue;
        }

        // 2. Lotes já ocupados por setor privado -> Upgrades ou Degradação
        if (tile.construcao && tile.construcao.categoria === 'RESIDENCIAL') {
          const evoluiu = this.avaliarResidencial(tile, anoAtual);
          if (evoluiu === 'UPGRADE') upgradesTier++;
          else if (evoluiu === 'DEGRADOU') degradacoes++;
          else if (evoluiu === 'REGENEROU') regeneracoes++;
        } else if (tile.construcao && tile.construcao.categoria === 'COMERCIAL') {
          const evoluiu = this.avaliarComercial(gridManager, tile, x, y, anoAtual);
          if (evoluiu === 'UPGRADE') upgradesTier++;
        }
      }
    }

    gridManager.atualizarConexoesViarias();

    // 3. Apuração da arrecadação tributária atualizada (Planta Genérica IPTU + ISS)
    const arrecadacoes = this.calcularArrecadacaoTributosPrivados(gridManager);

    return {
      novosPredios,
      upgradesTier,
      degradacoes,
      regeneracoes,
      arrecadacaoIPTUAdicional: arrecadacoes.iptuTotal,
      arrecadacaoISSAdicional: arrecadacoes.issTotal,
    };
  }

  /**
   * Avalia a implantação de uma nova construção em lote vazio
   */
  private static avaliarNovoLote(
    gridManager: GridManager,
    tile: TileData,
    x: number,
    y: number,
    anoAtual: number
  ): boolean {
    const chance = Math.random();
    const isPertoAvenida = this.proximoAvenida(gridManager, x, y);

    // Preferência Comercial em avenidas movimentadas
    if (isPertoAvenida && tile.nivelAtratividade >= 25 && chance < 0.25) {
      gridManager.construir(x, y, 'comercio-bairro', anoAtual);
      return true;
    }

    // Industrial em bordas da cidade com rua
    const isBorda = x <= 3 || x >= gridManager.tamanho - 4 || y >= gridManager.tamanho - 4;
    if (isBorda && tile.nivelSaneamento >= 20 && chance < 0.12) {
      gridManager.construir(x, y, 'galpao-industrial', anoAtual);
      return true;
    }

    // Residencial padrão se tiver condições mínimas de moradia
    if (tile.nivelSaude >= 15 && tile.nivelEducacao >= 15 && chance < 0.20) {
      gridManager.construir(x, y, 'casa-popular', anoAtual);
      return true;
    }

    // Ocupação espontânea modesta
    if (chance < 0.08) {
      gridManager.construir(x, y, 'casa-popular', anoAtual);
      return true;
    }

    return false;
  }

  /**
   * Avalia a evolução ou degradação de imóveis residenciais
   */
  private static avaliarResidencial(
    tile: TileData,
    anoAtual: number
  ): 'UPGRADE' | 'DEGRADOU' | 'REGENEROU' | 'MANTEVE' {
    const id = tile.construcaoId;

    // Degradação para cortiço por abandono público
    if ((tile.nivelSaude < 15 || tile.nivelSaneamento < 15 || !tile.conectadoRua) && id !== 'cortico-degradado') {
      if (Math.random() < 0.15) {
        tile.construcaoId = 'cortico-degradado';
        tile.construcao = BuildingCatalogManager.buscarPorId('cortico-degradado');
        tile.tierPrivado = 'DEGRADADO';
        return 'DEGRADOU';
      }
    }

    // Regeneração de cortiço se a prefeitura levou saneamento e saúde
    if (id === 'cortico-degradado' && tile.nivelSaneamento >= 25 && tile.nivelSaude >= 25 && tile.conectadoRua) {
      tile.construcaoId = 'casa-popular';
      tile.construcao = BuildingCatalogManager.buscarPorId('casa-popular');
      tile.tierPrivado = 1;
      tile.anoConstrucao = anoAtual;
      return 'REGENEROU';
    }

    // Upgrade Tier 1 (casa popular) -> Tier 2 (sobrado com jardim)
    if (id === 'casa-popular' && tile.nivelSaude >= 40 && tile.nivelEducacao >= 40 && tile.nivelSaneamento >= 30) {
      if (Math.random() < 0.20) {
        tile.construcaoId = 'sobrado-residencial';
        tile.construcao = BuildingCatalogManager.buscarPorId('sobrado-residencial');
        tile.tierPrivado = 2;
        return 'UPGRADE';
      }
    }

    // Upgrade Tier 2 (sobrado) -> Tier 3 (edifício residencial)
    if (
      id === 'sobrado-residencial' &&
      tile.nivelSaude >= 60 &&
      tile.nivelEducacao >= 60 &&
      tile.nivelSaneamento >= 50 &&
      tile.nivelAtratividade >= 40
    ) {
      if (Math.random() < 0.15) {
        tile.construcaoId = 'edificio-residencial';
        tile.construcao = BuildingCatalogManager.buscarPorId('edificio-residencial');
        tile.tierPrivado = 3;
        return 'UPGRADE';
      }
    }

    return 'MANTEVE';
  }

  /**
   * Avalia a evolução comercial (Tier 1 -> 2 -> 3)
   */
  private static avaliarComercial(
    gridManager: GridManager,
    tile: TileData,
    x: number,
    y: number,
    anoAtual: number
  ): 'UPGRADE' | 'MANTEVE' {
    const id = tile.construcaoId;
    const isPertoAvenida = this.proximoAvenida(gridManager, x, y);

    // Tier 1 -> Tier 2 (Galeria Comercial)
    if (id === 'comercio-bairro' && isPertoAvenida && tile.nivelAtratividade >= 40 && Math.random() < 0.20) {
      tile.construcaoId = 'galeria-comercial';
      tile.construcao = BuildingCatalogManager.buscarPorId('galeria-comercial');
      tile.tierPrivado = 2;
      tile.anoConstrucao = anoAtual;
      return 'UPGRADE';
    }

    // Tier 2 -> Tier 3 (Torre Corporativa de Serviços / ISS)
    if (id === 'galeria-comercial' && tile.nivelAtratividade >= 70 && tile.nivelSaneamento >= 50 && Math.random() < 0.15) {
      tile.construcaoId = 'centro-empresarial';
      tile.construcao = BuildingCatalogManager.buscarPorId('centro-empresarial');
      tile.tierPrivado = 3;
      return 'UPGRADE';
    }

    return 'MANTEVE';
  }

  private static proximoAvenida(gridManager: GridManager, x: number, y: number): boolean {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (gridManager.posicaoValida(nx, ny) && gridManager.getTile(nx, ny)?.construcaoId === 'avenida-estruturante') {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Apuração das receitas municipais originadas do parque edificado privado
   */
  public static calcularArrecadacaoTributosPrivados(gridManager: GridManager): {
    iptuTotal: number;
    issTotal: number;
  } {
    const grid = gridManager.getGrid();
    let iptuTotal = 0;
    let issTotal = 0;

    for (let y = 0; y < gridManager.tamanho; y++) {
      for (let x = 0; x < gridManager.tamanho; x++) {
        const tile = grid[y][x];
        const id = tile.construcaoId;
        if (!id) continue;

        switch (id) {
          case 'casa-popular':
            iptuTotal += 1_200;
            break;
          case 'sobrado-residencial':
            iptuTotal += 3_800;
            break;
          case 'edificio-residencial':
            iptuTotal += 18_000;
            break;
          case 'cortico-degradado':
            iptuTotal += 200;
            break;
          case 'comercio-bairro':
            iptuTotal += 2_500;
            issTotal += 6_000;
            break;
          case 'galeria-comercial':
            iptuTotal += 6_000;
            issTotal += 25_000;
            break;
          case 'centro-empresarial':
            iptuTotal += 22_000;
            issTotal += 120_000;
            break;
          case 'galpao-industrial':
            iptuTotal += 12_000;
            issTotal += 18_000;
            break;
        }
      }
    }

    return { iptuTotal, issTotal };
  }
}
