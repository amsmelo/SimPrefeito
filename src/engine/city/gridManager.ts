import { TileData, TipoTerreno } from '../../types/city';
import { BuildingCatalogManager, EDIFICIOS_ESPECIAIS_E_PRIVADOS } from './buildingCatalog';
import { PrivateGrowthEngine, RelatorioCrescimentoPrivado } from './privateGrowthEngine';

export interface PosicaoIso {
  x: number;
  y: number;
}

export class GridManager {
  public static readonly TAMANHO_PADRAO = 24;
  public static readonly TILE_WIDTH = 64;
  public static readonly TILE_HEIGHT = 32;

  public readonly tamanho: number;
  private grid: TileData[][];

  constructor(tamanho: number = GridManager.TAMANHO_PADRAO) {
    this.tamanho = tamanho;
    this.grid = this.criarMapaInicial(tamanho);
    this.atualizarConexoesViarias();
  }

  /**
   * Converte coordenadas lógicas da grade (x, y) para coordenadas isométricas na tela (screenX, screenY)
   * Projeção 2:1 clássica
   */
  public static gridToIso(
    gridX: number,
    gridY: number,
    tileWidth: number = GridManager.TILE_WIDTH,
    tileHeight: number = GridManager.TILE_HEIGHT
  ): { screenX: number; screenY: number } {
    const screenX = (gridX - gridY) * (tileWidth / 2);
    const screenY = (gridX + gridY) * (tileHeight / 2);
    return { screenX, screenY };
  }

  /**
   * Converte coordenadas de tela/toque para coordenadas inteiras do grid (tileX, tileY)
   */
  public static isoToGrid(
    screenX: number,
    screenY: number,
    tileWidth: number = GridManager.TILE_WIDTH,
    tileHeight: number = GridManager.TILE_HEIGHT
  ): PosicaoIso {
    const halfW = tileWidth / 2;
    const halfH = tileHeight / 2;

    const xFloat = (screenX / halfW + screenY / halfH) / 2;
    const yFloat = (screenY / halfH - screenX / halfW) / 2;

    return {
      x: Math.floor(xFloat),
      y: Math.floor(yFloat),
    };
  }

  public getGrid(): TileData[][] {
    return this.grid;
  }

  public getTile(x: number, y: number): TileData | undefined {
    if (!this.posicaoValida(x, y)) return undefined;
    return this.grid[y][x];
  }

  public posicaoValida(x: number, y: number): boolean {
    return x >= 0 && x < this.tamanho && y >= 0 && y < this.tamanho;
  }

  /**
   * Verifica se o tile possui conexão contígua (vizinho N, S, L, O) com rua pavimentada ou avenida
   */
  public verificarConexaoRua(x: number, y: number): boolean {
    const vizinhos = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ];

    for (const v of vizinhos) {
      if (this.posicaoValida(v.x, v.y)) {
        const tile = this.grid[v.y][v.x];
        if (
          tile.construcaoId === 'rua-pavimentada' ||
          tile.construcaoId === 'avenida-estruturante'
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Atualiza o status de conectadoRua de todos os lotes do mapa
   */
  public atualizarConexoesViarias(): void {
    for (let y = 0; y < this.tamanho; y++) {
      for (let x = 0; x < this.tamanho; x++) {
        const tile = this.grid[y][x];
        const isRoad =
          tile.construcaoId === 'rua-pavimentada' ||
          tile.construcaoId === 'avenida-estruturante';
        tile.conectadoRua = isRoad ? true : this.verificarConexaoRua(x, y);
      }
    }
  }

  /**
   * Valida se uma construção pode ser assentada no tile
   */
  public podeConstruir(
    x: number,
    y: number,
    construcaoId: string
  ): { permitido: boolean; motivo?: string } {
    if (!this.posicaoValida(x, y)) {
      return { permitido: false, motivo: 'Fora dos limites do município' };
    }

    const tile = this.grid[y][x];

    if (tile.terreno === 'AGUA') {
      return { permitido: false, motivo: 'Área de preservação permanente (Rio / Água)' };
    }

    if (tile.construcaoId) {
      return { permitido: false, motivo: 'Terreno já ocupado por outra edificação' };
    }

    const item = BuildingCatalogManager.buscarPorId(construcaoId);
    if (!item) {
      return { permitido: false, motivo: 'Construção desconhecida no catálogo' };
    }

    if (item.requerConexaoRua && !this.verificarConexaoRua(x, y)) {
      return { permitido: false, motivo: 'Requer conexão direta com rua ou avenida' };
    }

    return { permitido: true };
  }

  /**
   * Executa a construção da obra pública ou privada no grid
   */
  public construir(x: number, y: number, construcaoId: string, anoAtual: number = 2025): boolean {
    const validacao = this.podeConstruir(x, y, construcaoId);
    if (!validacao.permitido) return false;

    const item = BuildingCatalogManager.buscarPorId(construcaoId);
    if (!item) return false;

    const tile = this.grid[y][x];
    tile.construcaoId = item.id;
    tile.construcao = item;
    tile.anoConstrucao = anoAtual;

    this.atualizarConexoesViarias();
    return true;
  }

  /**
   * Demolição / desapropriação de um lote
   */
  public demolir(x: number, y: number): boolean {
    if (!this.posicaoValida(x, y)) return false;
    const tile = this.grid[y][x];
    if (!tile.construcaoId) return false;

    // Não permite demolir a Prefeitura histórica
    if (tile.construcaoId === 'prefeitura-historica') return false;

    tile.construcaoId = undefined;
    tile.construcao = undefined;
    tile.anoConstrucao = undefined;

    this.atualizarConexoesViarias();
    return true;
  }

  /**
   * Simulação do setor privado autônomo (residencial, comercial e industrial)
   */
  public simularCrescimentoOrganico(anoAtual: number): RelatorioCrescimentoPrivado {
    return PrivateGrowthEngine.simularCiclo(this, anoAtual);
  }

  /**
   * Cria o mapa procedural inicial com relevo, rio sinuoso, centro histórico e bairros
   */
  private criarMapaInicial(tamanho: number): TileData[][] {
    const mapa: TileData[][] = [];

    for (let y = 0; y < tamanho; y++) {
      const linha: TileData[] = [];
      for (let x = 0; x < tamanho; x++) {
        // Rio sinuoso natural passando pelo canto noroeste / oeste
        // Curva suave do rio
        const distRio = Math.abs(y - (18 + Math.sin(x / 3) * 2.5));
        const isAgua = distRio < 1.4 && x >= 0 && x <= 18;

        const terreno: TipoTerreno = isAgua ? 'AGUA' : 'GRAMA';
        const variacao = (x * 7 + y * 13) % 3;

        linha.push({
          x,
          y,
          terreno,
          variacaoTerreno: variacao,
          conectadoRua: false,
          nivelSaude: 10,
          nivelEducacao: 10,
          nivelSaneamento: 5,
          nivelAtratividade: 15,
          valorVenalIPTU: 120_000,
        });
      }
      mapa.push(linha);
    }

    // Configuração do Centro Histórico e Vias Iniciais
    const centroX = 11;
    const centroY = 11;

    // Avenida Estruturante central (Eixo Leste-Oeste)
    for (let x = 6; x <= 16; x++) {
      if (mapa[centroY][x].terreno !== 'AGUA') {
        mapa[centroY][x].construcaoId = 'avenida-estruturante';
        mapa[centroY][x].construcao = BuildingCatalogManager.buscarPorId('avenida-estruturante');
      }
    }

    // Rua conectora (Eixo Norte-Sul)
    for (let y = 7; y <= 15; y++) {
      if (mapa[y][centroX].terreno !== 'AGUA' && y !== centroY) {
        mapa[y][centroX].construcaoId = 'rua-pavimentada';
        mapa[y][centroX].construcao = BuildingCatalogManager.buscarPorId('rua-pavimentada');
      }
    }

    // Palácio da Cidade (Prefeitura) em (11, 10)
    mapa[10][centroX].construcaoId = 'prefeitura-historica';
    mapa[10][centroX].construcao = EDIFICIOS_ESPECIAIS_E_PRIVADOS['prefeitura-historica'];
    mapa[10][centroX].anoConstrucao = 1982;

    // Praça Central em (11, 12)
    mapa[12][centroX].construcaoId = 'praca-parque-urbano';
    mapa[12][centroX].construcao = BuildingCatalogManager.buscarPorId('praca-parque-urbano');
    mapa[12][centroX].anoConstrucao = 2005;

    // Posto de Saúde inicial
    mapa[9][10].construcaoId = 'ubs-tipo-1';
    mapa[9][10].construcao = BuildingCatalogManager.buscarPorId('ubs-tipo-1');
    mapa[9][10].anoConstrucao = 2018;

    // Creche inicial em (13, 12)
    mapa[12][13].construcaoId = 'creche-municipal';
    mapa[12][13].construcao = BuildingCatalogManager.buscarPorId('creche-municipal');
    mapa[12][13].anoConstrucao = 2020;

    // Casas e pequenos comércios residenciais pioneiros
    const ocupacoesIniciais: { x: number; y: number; id: string }[] = [
      { x: 9, y: 11, id: 'comercio-bairro' },
      { x: 10, y: 12, id: 'comercio-bairro' },
      { x: 12, y: 10, id: 'casa-popular' },
      { x: 13, y: 10, id: 'casa-popular' },
      { x: 10, y: 13, id: 'casa-popular' },
      { x: 12, y: 13, id: 'edificio-residencial' },
      { x: 8, y: 12, id: 'casa-popular' },
      { x: 14, y: 11, id: 'comercio-bairro' },
    ];

    for (const oc of ocupacoesIniciais) {
      if (mapa[oc.y][oc.x].terreno === 'GRAMA') {
        mapa[oc.y][oc.x].construcaoId = oc.id;
        mapa[oc.y][oc.x].construcao = BuildingCatalogManager.buscarPorId(oc.id);
        mapa[oc.y][oc.x].anoConstrucao = 2022;
      }
    }

    return mapa;
  }
}
