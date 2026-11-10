import { Graphics } from 'pixi.js';
import { TileData, ItemCatalogoConstrucao, TipoOverlay } from '../../types/city';
import { GridManager } from './gridManager';

export class BuildingRenderer {
  /**
   * Renderiza o piso/solo do lote isométrico com suporte a Overlays analíticos
   */
  public static desenharChao(
    g: Graphics,
    cx: number,
    cy: number,
    halfW: number,
    halfH: number,
    tile: TileData,
    overlay: TipoOverlay = 'NORMAL',
    tickTime: number = 0
  ): void {
    const points = [
      cx, cy - halfH,
      cx + halfW, cy,
      cx, cy + halfH,
      cx - halfW, cy,
    ];

    // =========================================================================
    // 1. MODO DE CAMADA ANALÍTICA (OVERLAY)
    // =========================================================================
    if (overlay !== 'NORMAL') {
      let corOverlay = 0x334155;
      let alphaOverlay = 0.75;

      if (overlay === 'SAUDE') {
        if (tile.nivelSaude >= 50) corOverlay = 0x10b981; // Verde excelente
        else if (tile.nivelSaude >= 25) corOverlay = 0xf59e0b; // Amarelo regular
        else corOverlay = 0xef4444; // Vermelho desassistido
      } else if (overlay === 'EDUCACAO') {
        if (tile.nivelEducacao >= 50) corOverlay = 0x3b82f6; // Azul excelente
        else if (tile.nivelEducacao >= 25) corOverlay = 0xf59e0b;
        else corOverlay = 0xef4444;
      } else if (overlay === 'VALOR_VENAL') {
        // Planta Genérica de Valores (PGV - IPTU)
        if (tile.valorVenalIPTU > 350_000) corOverlay = 0xa855f7; // Púrpura (Alto Padrão)
        else if (tile.valorVenalIPTU > 200_000) corOverlay = 0xeab308; // Dourado
        else if (tile.valorVenalIPTU > 120_000) corOverlay = 0x22c55e; // Médio
        else corOverlay = 0x64748b; // Periferia básica
      } else if (overlay === 'SANEAMENTO') {
        if (tile.nivelSaneamento >= 50) corOverlay = 0x06b6d4; // Ciano limpo
        else if (tile.nivelSaneamento >= 25) corOverlay = 0x0284c7;
        else corOverlay = 0x78350f; // Marrom sem esgoto
      }

      g.poly(points)
        .fill({ color: corOverlay, alpha: alphaOverlay })
        .stroke({ width: 0.5, color: 0xffffff, alpha: 0.3 });
      return;
    }

    // =========================================================================
    // 2. MODO NORMAL (ESTÉTICA POLIDA)
    // =========================================================================
    if (tile.terreno === 'AGUA') {
      // Água com ondulação dinâmica suave
      const ondaOffset = Math.sin(tickTime * 2 + (tile.x + tile.y)) * 1.5;
      g.poly(points)
        .fill({ color: 0x0284c7, alpha: 0.92 })
        .stroke({ width: 0.5, color: 0x38bdf8, alpha: 0.5 });

      // Reflexos de onda de água
      g.poly([
        cx - 8, cy + ondaOffset,
        cx + 8, cy + ondaOffset + 1.5,
      ]).stroke({ width: 1.5, color: 0xffffff, alpha: 0.45 });
      return;
    }

    // Ruas e Avenidas Estruturantes
    if (tile.construcaoId === 'rua-pavimentada') {
      // Base da rua
      g.poly(points)
        .fill({ color: 0x334155 })
        .stroke({ width: 0.5, color: 0x1e293b, alpha: 0.6 });

      // Calçadas laterais finas
      g.poly([cx - halfW + 4, cy, cx, cy - halfH + 2, cx + halfW - 4, cy])
        .stroke({ width: 1.5, color: 0x64748b, alpha: 0.5 });

      // Faixa tracejada central branca
      g.poly([cx - 8, cy - 4, cx + 8, cy + 4])
        .stroke({ width: 1.5, color: 0xf8fafc, alpha: 0.9 });

      // Poste de luz na esquina
      g.circle(cx - 24, cy - 2, 1.5).fill({ color: 0x94a3b8 });
      g.circle(cx - 24, cy - 8, 2).fill({ color: 0xfef08a, alpha: 0.75 });
      return;
    }

    if (tile.construcaoId === 'avenida-estruturante') {
      // Pista dupla larga
      g.poly(points)
        .fill({ color: 0x1e293b })
        .stroke({ width: 1, color: 0x0f172a, alpha: 0.8 });

      // Calçadas estruturadas de concreto
      g.poly([cx - halfW + 6, cy, cx, cy - halfH + 3, cx + halfW - 6, cy])
        .stroke({ width: 2, color: 0x94a3b8, alpha: 0.6 });

      // Faixa dupla amarela contínua de alta visibilidade
      g.poly([cx - 10, cy - 5, cx + 10, cy + 5])
        .stroke({ width: 2.2, color: 0xfbbf24, alpha: 0.95 });

      // Postes com halo suave
      g.circle(cx + 22, cy - 4, 2).fill({ color: 0xfbbf24, alpha: 0.85 });
      return;
    }

    // Gramado natural com variações de verde
    const paletaGrama = [0x15803d, 0x16a34a, 0x14532d];
    const corGrama = paletaGrama[tile.variacaoTerreno % paletaGrama.length];

    g.poly(points)
      .fill({ color: corGrama })
      .stroke({ width: 0.5, color: 0x14532d, alpha: 0.25 });
  }

  /**
   * Renderiza a edificação com 3 faces volumétricas, sombras e detalhes específicos
   */
  public static desenharEdificacao(
    g: Graphics,
    cx: number,
    cy: number,
    construcao: ItemCatalogoConstrucao,
    tickTime: number = 0,
    timestampConstrucao?: number
  ): void {
    if (construcao.id === 'rua-pavimentada' || construcao.id === 'avenida-estruturante') {
      return;
    }

    // Efeito de subida/poeira recente (primeiros 600ms após ser construído)
    let offsetY = 0;
    if (timestampConstrucao) {
      const delta = (performance.now() - timestampConstrucao) / 600;
      if (delta < 1) {
        offsetY = Math.sin(delta * Math.PI) * -8;
      }
    }

    const h = (construcao.alturaPrismatica || 20) + offsetY;
    const pw = 16;
    const ph = 8;
    const bx = cx;
    const by = cy + 2;

    // 1. Face Esquerda (Front-Left) - Iluminação média solar (tom médio)
    g.poly([
      bx - pw, by,
      bx, by + ph,
      bx, by + ph - h,
      bx - pw, by - h,
    ]).fill({ color: escurecerCor(construcao.corPrimaria, 0.84) });

    // 2. Face Direita (Front-Right) - Sombra (lado oposto ao sol)
    g.poly([
      bx, by + ph,
      bx + pw, by,
      bx + pw, by - h,
      bx, by + ph - h,
    ]).fill({ color: escurecerCor(construcao.corPrimaria, 0.65) });

    // 3. Face Superior / Telhado - Iluminação direta (mais brilhante)
    const topPoints = [
      bx, by - ph - h,
      bx + pw, by - h,
      bx, by + ph - h,
      bx - pw, by - h,
    ];
    g.poly(topPoints).fill({ color: construcao.corPrimaria });
    g.poly(topPoints).stroke({ width: 0.75, color: 0xffffff, alpha: 0.25 });

    // Detalhes estilizados icônicos
    this.desenharDetalhesEspecificos(g, bx, by, h, pw, ph, construcao, tickTime);
  }

  private static desenharDetalhesEspecificos(
    g: Graphics,
    bx: number,
    by: number,
    h: number,
    pw: number,
    ph: number,
    c: ItemCatalogoConstrucao,
    tickTime: number
  ): void {
    // -------------------------------------------------------------------------
    // 1. UBS TIPO I (Saúde da Família)
    // -------------------------------------------------------------------------
    if (c.id === 'ubs-tipo-1') {
      // Cruz vermelha grande na fachada esquerda
      const fx = bx - pw / 2;
      const fy = by - h / 2;
      g.poly([fx - 1.5, fy - 6, fx + 1.5, fy - 6, fx + 1.5, fy + 6, fx - 1.5, fy + 6]).fill({ color: 0xdc2626 });
      g.poly([fx - 6, fy - 1.5, fx + 6, fy - 1.5, fx + 6, fy + 1.5, fx - 6, fy + 1.5]).fill({ color: 0xdc2626 });

      // Toldo azul da recepção
      g.poly([bx - 12, by - 2, bx - 2, by + 4, bx - 2, by + 7, bx - 12, by + 1]).fill({ color: 0x2563eb });

      // Ambulância estilizada estacionada no pátio direito
      const ambX = bx + 16;
      const ambY = by + 5;
      // Chassi branco da ambulância
      g.rect(ambX - 5, ambY - 4, 10, 5).fill({ color: 0xffffff });
      // Vidro azul da cabine
      g.rect(ambX - 4, ambY - 3, 3, 3).fill({ color: 0x38bdf8 });
      // Cruz vermelha na lataria
      g.rect(ambX + 1, ambY - 3, 3, 1).fill({ color: 0xef4444 });
      g.rect(ambX + 2, ambY - 4, 1, 3).fill({ color: 0xef4444 });
      // Giroflex piscante azul/vermelho
      const pisca = Math.sin(tickTime * 6) > 0;
      g.circle(ambX - 1, ambY - 5, 1.2).fill({ color: pisca ? 0xef4444 : 0x3b82f6 });
    }

    // -------------------------------------------------------------------------
    // 2. CRECHE MUNICIPAL & ESCOLA
    // -------------------------------------------------------------------------
    else if (c.id === 'creche-municipal') {
      // Telhado alegre inclinado em duas águas
      g.poly([
        bx, by - ph - h - 10,
        bx + pw, by - h,
        bx, by + ph - h,
      ]).fill({ color: 0xf59e0b });

      // Parquinho infantil no quintal direito (escorregador e gangorra)
      const pqX = bx + 15;
      const pqY = by + 4;
      g.poly([pqX - 4, pqY, pqX + 2, pqY - 5, pqX + 4, pqY - 4]).stroke({ width: 1.5, color: 0xef4444 });
      g.circle(pqX, pqY + 2, 2.5).fill({ color: 0x3b82f6 }); // gira-gira
    }

    else if (c.id === 'escola-fundamental') {
      // Quadra poliesportiva com linhas brancas no pátio lateral
      const qx = bx + 18;
      const qy = by + 3;
      g.poly([qx - 8, qy - 4, qx + 8, qy - 4, qx + 8, qy + 4, qx - 8, qy + 4])
        .fill({ color: 0x0284c7 })
        .stroke({ width: 1, color: 0xffffff, alpha: 0.8 });

      // Janelas de salas de aula na fachada
      for (let i = 0; i < 3; i++) {
        g.rect(bx - 14 + i * 5, by - h + 6, 3, 4).fill({ color: 0x38bdf8 });
      }
    }

    // -------------------------------------------------------------------------
    // 3. ESTAÇÃO DE TRATAMENTO DE ESGOTO (ETE)
    // -------------------------------------------------------------------------
    else if (c.id === 'ete-tratamento-esgoto') {
      // Dois tanques circulares de decantação
      const t1x = bx - 7;
      const t1y = by - h + 2;
      const t2x = bx + 7;
      const t2y = by - h + 3;

      // Água com oscilação esverdeada
      const onda = Math.sin(tickTime * 3) * 0.5;
      g.circle(t1x, t1y, 6).fill({ color: 0x0f766e }).stroke({ width: 1, color: 0x94a3b8 });
      g.circle(t1x, t1y, 4 + onda).fill({ color: 0x14b8a6 });

      g.circle(t2x, t2y, 5).fill({ color: 0x0284c7 }).stroke({ width: 1, color: 0x94a3b8 });

      // Tubulações metálicas interligando os tanques
      g.poly([t1x + 4, t1y, t2x - 4, t2y]).stroke({ width: 2, color: 0xcbd5e1 });

      // Chaminé com leve fumaça limpa/vapor
      g.rect(bx - 2, by - h - 16, 4, 16).fill({ color: 0x475569 });
      g.rect(bx - 2, by - h - 18, 4, 2).fill({ color: 0xef4444 });
      const puffY = by - h - 22 - (tickTime % 1.5) * 8;
      g.circle(bx, puffY, 2.5).fill({ color: 0xffffff, alpha: 0.4 });
    }

    // -------------------------------------------------------------------------
    // 4. PARQUE URBANO / PRAÇA DE CONVIVÊNCIA
    // -------------------------------------------------------------------------
    else if (c.id === 'praca-parque-urbano') {
      // Caminho de pedra central
      g.poly([bx - 10, by - 2, bx + 10, by + 4]).stroke({ width: 3, color: 0xd97706 });

      // Árvores com copas volumétricas sombreadas
      this.desenharArvore(g, bx - 8, by - 4, 10);
      this.desenharArvore(g, bx + 8, by + 2, 8);

      // Banco de praça
      g.rect(bx - 2, by + 3, 5, 2).fill({ color: 0x78350f });
    }

    // -------------------------------------------------------------------------
    // 5. HOSPITAL MUNICIPAL GERAL
    // -------------------------------------------------------------------------
    else if (c.id === 'hospital-municipal') {
      // Heliponto no telhado com a letra H
      g.circle(bx, by - h, 8).stroke({ width: 1.5, color: 0xffffff });
      g.poly([bx - 3, by - h - 4, bx - 3, by - h + 4]).stroke({ width: 1.5, color: 0xffffff });
      g.poly([bx + 3, by - h - 4, bx + 3, by - h + 4]).stroke({ width: 1.5, color: 0xffffff });
      g.poly([bx - 3, by - h, bx + 3, by - h]).stroke({ width: 1.5, color: 0xffffff });

      // Cruz vermelha grande na fachada
      g.rect(bx - 8, by - h / 2 - 4, 3, 8).fill({ color: 0xdc2626 });
      g.rect(bx - 11, by - h / 2 - 1.5, 9, 3).fill({ color: 0xdc2626 });
    }

    // -------------------------------------------------------------------------
    // 6. PALÁCIO DA CIDADE (PREFEITURA)
    // -------------------------------------------------------------------------
    else if (c.id === 'prefeitura-historica') {
      // Cúpula colonial dourada
      g.circle(bx, by - h - 7, 8).fill({ color: 0xf59e0b }).stroke({ width: 1, color: 0xb45309 });
      // Mastro com bandeira
      g.rect(bx - 1, by - h - 18, 2, 11).fill({ color: 0xffffff });
      // Bandeira brasileira verde/amarela tremulando
      const tremula = Math.sin(tickTime * 4) * 1.5;
      g.poly([bx + 1, by - h - 18, bx + 8 + tremula, by - h - 15, bx + 1, by - h - 12]).fill({ color: 0x16a34a });
    }

    // -------------------------------------------------------------------------
    // 7. EDIFÍCIOS PRIVADOS DINÂMICOS (RESIDENCIAIS / COMERCIAIS / INDUSTRIAIS)
    // -------------------------------------------------------------------------
    else if (c.id === 'casa-popular') {
      // Telhado cerâmico de 2 águas
      g.poly([
        bx, by - ph - h - 6,
        bx + pw, by - h,
        bx, by + ph - h,
      ]).fill({ color: 0xb45309 });
      // Porta
      g.rect(bx - 6, by + 1, 3, 5).fill({ color: 0x451a03 });
    }

    else if (c.id === 'sobrado-residencial') {
      // 2 pavimentos com sacada
      g.poly([
        bx, by - ph - h - 8,
        bx + pw, by - h,
        bx, by + ph - h,
      ]).fill({ color: 0x9a3412 });
      // Janelas do andar superior
      g.rect(bx - 12, by - h + 6, 4, 4).fill({ color: 0x38bdf8 });
      g.rect(bx - 5, by - h + 6, 4, 4).fill({ color: 0x38bdf8 });
    }

    else if (c.id === 'edificio-residencial') {
      // Janelas iluminadas por andares
      for (let floor = 1; floor <= 5; floor++) {
        const jy = by - floor * 7;
        g.rect(bx - 12, jy, 3, 3).fill({ color: 0xfef08a, alpha: 0.9 });
        g.rect(bx + 6, jy, 3, 3).fill({ color: 0xfef08a, alpha: 0.9 });
      }
    }

    else if (c.id === 'cortico-degradado') {
      // Manchas de degradação e telhado remendado
      g.rect(bx - 10, by - h + 4, 4, 4).fill({ color: 0x292524 });
      g.poly([bx - 8, by - h - 2, bx + 6, by - h - 4]).stroke({ width: 1.5, color: 0x78716c });
    }

    else if (c.id === 'comercio-bairro') {
      // Toldo listrado vermelho e branco
      g.poly([
        bx - pw, by - 6,
        bx, by + ph - 6,
        bx + 2, by + ph - 3,
        bx - pw + 2, by - 3,
      ]).fill({ color: 0xdc2626 });
    }

    else if (c.id === 'galeria-comercial') {
      // Vitrine envidraçada ampla
      g.rect(bx - 12, by - 4, 10, 8).fill({ color: 0x38bdf8, alpha: 0.85 });
    }

    else if (c.id === 'centro-empresarial') {
      // Fachada espelhada com reflexos corporativos
      g.rect(bx - 12, by - h + 8, 8, h - 14).fill({ color: 0x38bdf8, alpha: 0.7 });
      g.rect(bx + 2, by - h + 8, 8, h - 14).fill({ color: 0x0284c7, alpha: 0.8 });
    }

    else if (c.id === 'galpao-industrial') {
      // Telhado dente de serra industrial e chaminé com fumaça
      g.poly([bx - pw, by - h, bx - pw / 2, by - h - 8, bx, by - h, bx + pw / 2, by - h - 8, bx + pw, by - h]).fill({ color: 0x52525b });
      // Chaminé com fumaça subindo
      const puffY = by - h - 14 - (tickTime % 1.5) * 6;
      g.circle(bx + 10, puffY, 2).fill({ color: 0x71717a, alpha: 0.5 });
    }
  }

  private static desenharArvore(g: Graphics, x: number, y: number, raio: number): void {
    // Tronco
    g.rect(x - 1, y, 2, 6).fill({ color: 0x78350f });
    // Copa volumétrica (sombra + luz)
    g.circle(x, y - 4, raio).fill({ color: 0x14532d });
    g.circle(x - 1, y - 6, raio * 0.7).fill({ color: 0x22c55e });
  }

  /**
   * Destaca o raio de alcance/influência do equipamento no chão antes de construir
   */
  public static desenharRaioInfluencia(
    g: Graphics,
    centroX: number,
    centroY: number,
    raioTiles: number,
    tickTime: number = 0
  ): void {
    const halfW = GridManager.TILE_WIDTH / 2;
    const halfH = GridManager.TILE_HEIGHT / 2;
    const { screenX, screenY } = GridManager.gridToIso(centroX, centroY);

    // Pulsação suave do raio de atendimento
    const pulse = Math.sin(tickTime * 4) * 0.15 + 0.85;
    const rx = raioTiles * halfW * pulse;
    const ry = raioTiles * halfH * pulse;

    // Círculo projetado isometricamente (elipse 2:1)
    g.ellipse(screenX, screenY, rx, ry)
      .fill({ color: 0x38bdf8, alpha: 0.18 })
      .stroke({ width: 2, color: 0x38bdf8, alpha: 0.85 });
  }
}

function escurecerCor(hex: number, fator: number): number {
  const r = Math.min(255, Math.floor(((hex >> 16) & 0xff) * fator));
  const g = Math.min(255, Math.floor(((hex >> 8) & 0xff) * fator));
  const b = Math.min(255, Math.floor((hex & 0xff) * fator));
  return (r << 16) | (g << 8) | b;
}
