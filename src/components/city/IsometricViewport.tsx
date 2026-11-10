import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GridManager } from '../../engine/city/gridManager';
import { BuildingRenderer } from '../../engine/city/buildingRenderer';
import { TileData, ItemCatalogoConstrucao, TipoOverlay, FloatingTextEffect } from '../../types/city';

interface IsometricViewportProps {
  gridManager: GridManager;
  obraSelecionada?: ItemCatalogoConstrucao;
  tileSelecionado?: TileData;
  overlay?: TipoOverlay;
  onTileClick: (x: number, y: number) => void;
  margemInvestimentoSuficiente: (obra: ItemCatalogoConstrucao) => boolean;
}

export const IsometricViewport: React.FC<IsometricViewportProps> = ({
  gridManager,
  obraSelecionada,
  tileSelecionado,
  overlay = 'NORMAL',
  onTileClick,
  margemInvestimentoSuficiente,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const worldContainerRef = useRef<Container | null>(null);
  const mapGraphicsRef = useRef<Graphics | null>(null);
  const overlayGraphicsRef = useRef<Graphics | null>(null);
  const cursorGraphicsRef = useRef<Graphics | null>(null);
  const effectsContainerRef = useRef<Container | null>(null);

  // Efeitos de texto flutuante ("- R$ 800k Capital | + R$ 350k Custeio")
  const floatingTextsRef = useRef<FloatingTextEffect[]>([]);

  // Câmera (Pan e Zoom)
  const cameraRef = useRef({
    x: 0,
    y: 0,
    zoom: 1.15,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    cameraStartX: 0,
    cameraStartY: 0,
    hasMoved: false,
    initialPinchDistance: 0,
    initialZoom: 1,
    tickTime: 0,
  });

  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);

  // Inicialização do PixiJS Application
  useEffect(() => {
    let mounted = true;
    const parent = containerRef.current;
    if (!parent) return;

    const initPixi = async () => {
      const app = new Application();
      await app.init({
        resizeTo: parent,
        backgroundColor: 0x090d16,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      });

      if (!mounted) {
        app.destroy(true);
        return;
      }

      appRef.current = app;
      parent.appendChild(app.canvas);

      const world = new Container();
      worldContainerRef.current = world;
      app.stage.addChild(world);

      const mapGraphics = new Graphics();
      mapGraphicsRef.current = mapGraphics;
      world.addChild(mapGraphics);

      const overlayGraphics = new Graphics();
      overlayGraphicsRef.current = overlayGraphics;
      world.addChild(overlayGraphics);

      const cursorGraphics = new Graphics();
      cursorGraphicsRef.current = cursorGraphics;
      world.addChild(cursorGraphics);

      const effectsContainer = new Container();
      effectsContainerRef.current = effectsContainer;
      world.addChild(effectsContainer);

      // Centraliza a câmera no meio do mapa (tile 11, 11)
      const centerX = parent.clientWidth / 2;
      const centerY = parent.clientHeight / 2 - 120;
      cameraRef.current.x = centerX;
      cameraRef.current.y = centerY;
      world.position.set(centerX, centerY);
      world.scale.set(cameraRef.current.zoom);

      renderizarMapa();

      // Loop do Ticker para Micro-animações e Partículas Flutuantes
      app.ticker.add((time) => {
        cameraRef.current.tickTime += time.deltaTime * 0.03;
        atualizarTextosFlutuantes(time.deltaTime * 0.016);
      });
    };

    initPixi();

    return () => {
      mounted = false;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  // Atualizador de partículas de texto
  const atualizarTextosFlutuantes = (deltaSeconds: number) => {
    const container = effectsContainerRef.current;
    if (!container) return;

    container.removeChildren();

    const textos = floatingTextsRef.current;
    for (let i = textos.length - 1; i >= 0; i--) {
      const item = textos[i];
      item.tempoVida -= deltaSeconds;
      item.deslocamentoY += deltaSeconds * 28;

      if (item.tempoVida <= 0) {
        textos.splice(i, 1);
        continue;
      }

      const { screenX, screenY } = GridManager.gridToIso(item.x, item.y);
      const textStyle = new TextStyle({
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11,
        fontWeight: 'bold',
        fill: item.cor,
        stroke: { color: 0x000000, width: 3 },
      });

      const pixiText = new Text({
        text: item.texto,
        style: textStyle,
      });
      pixiText.x = screenX - pixiText.width / 2;
      pixiText.y = screenY - item.deslocamentoY - 25;
      pixiText.alpha = Math.min(1, item.tempoVida * 1.5);
      container.addChild(pixiText);
    }
  };

  // Renderização central de todos os elementos isométricos com Depth Sorting
  const renderizarMapa = useCallback(() => {
    const g = mapGraphicsRef.current;
    if (!g) return;

    g.clear();

    const tamanho = gridManager.tamanho;
    const grid = gridManager.getGrid();
    const halfW = GridManager.TILE_WIDTH / 2;
    const halfH = GridManager.TILE_HEIGHT / 2;
    const tickTime = cameraRef.current.tickTime;

    // Depth Sorting por x + y
    const tilesOrdenados: TileData[] = [];
    for (let y = 0; y < tamanho; y++) {
      for (let x = 0; x < tamanho; x++) {
        tilesOrdenados.push(grid[y][x]);
      }
    }
    tilesOrdenados.sort((a, b) => a.x + a.y - (b.x + b.y));

    for (const tile of tilesOrdenados) {
      const { screenX, screenY } = GridManager.gridToIso(tile.x, tile.y);

      // 1. Chão com suporte a Overlays analíticos
      BuildingRenderer.desenharChao(g, screenX, screenY, halfW, halfH, tile, overlay, tickTime);

      // 2. Edificação 2.5D com sombreamento e detalhes
      if (tile.construcao) {
        BuildingRenderer.desenharEdificacao(
          g,
          screenX,
          screenY,
          tile.construcao,
          tickTime,
          tile.timestampConstrucao
        );
      }
    }
  }, [gridManager, overlay]);

  // Atualiza mapa quando muda o grid ou overlay
  useEffect(() => {
    renderizarMapa();
  }, [renderizarMapa]);

  // Renderiza o cursor isométrico e o raio de alcance da obra
  useEffect(() => {
    const cg = cursorGraphicsRef.current;
    const og = overlayGraphicsRef.current;
    if (!cg || !og) return;

    cg.clear();
    og.clear();

    const halfW = GridManager.TILE_WIDTH / 2;
    const halfH = GridManager.TILE_HEIGHT / 2;
    const tickTime = cameraRef.current.tickTime;

    // 1. Destaque do Tile Selecionado
    if (tileSelecionado) {
      const { screenX, screenY } = GridManager.gridToIso(tileSelecionado.x, tileSelecionado.y);
      cg.poly([
        screenX, screenY - halfH,
        screenX + halfW, screenY,
        screenX, screenY + halfH,
        screenX - halfW, screenY,
      ]).stroke({ width: 2.5, color: 0x38bdf8, alpha: 0.95 });
    }

    // 2. Cursor de Construção com Raio de Alcance
    if (hoverTile && gridManager.posicaoValida(hoverTile.x, hoverTile.y)) {
      const { screenX, screenY } = GridManager.gridToIso(hoverTile.x, hoverTile.y);

      if (obraSelecionada) {
        const validacao = gridManager.podeConstruir(hoverTile.x, hoverTile.y, obraSelecionada.id);
        const recursoOk = margemInvestimentoSuficiente(obraSelecionada);
        const valido = validacao.permitido && recursoOk;

        // Desenha no chão o raio de alcance/influência do equipamento antes de confirmar
        if (obraSelecionada.raioInfluencia > 0) {
          BuildingRenderer.desenharRaioInfluencia(
            og,
            hoverTile.x,
            hoverTile.y,
            obraSelecionada.raioInfluencia,
            tickTime
          );
        }

        const corFill = valido ? 0x10b981 : 0xef4444;
        const corStroke = valido ? 0x34d399 : 0xf87171;

        cg.poly([
          screenX, screenY - halfH,
          screenX + halfW, screenY,
          screenX, screenY + halfH,
          screenX - halfW, screenY,
        ])
          .fill({ color: corFill, alpha: 0.35 })
          .stroke({ width: 2, color: corStroke, alpha: 0.9 });

        // Desenha o prisma holográfico da obra
        desenharEdificacaoFantasma(cg, screenX, screenY, obraSelecionada, valido);
      } else {
        cg.poly([
          screenX, screenY - halfH,
          screenX + halfW, screenY,
          screenX, screenY + halfH,
          screenX - halfW, screenY,
        ]).stroke({ width: 1.5, color: 0xffffff, alpha: 0.6 });
      }
    }
  }, [hoverTile, obraSelecionada, tileSelecionado, gridManager, margemInvestimentoSuficiente]);

  // Gestos de Pan, Zoom e Toque
  const handlePointerDown = (e: React.PointerEvent) => {
    cameraRef.current.isDragging = true;
    cameraRef.current.dragStartX = e.clientX;
    cameraRef.current.dragStartY = e.clientY;
    cameraRef.current.cameraStartX = cameraRef.current.x;
    cameraRef.current.cameraStartY = cameraRef.current.y;
    cameraRef.current.hasMoved = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const cam = cameraRef.current;

    if (cam.isDragging) {
      const dx = e.clientX - cam.dragStartX;
      const dy = e.clientY - cam.dragStartY;

      if (Math.hypot(dx, dy) > 6) {
        cam.hasMoved = true;
      }

      cam.x = cam.cameraStartX + dx;
      cam.y = cam.cameraStartY + dy;

      if (worldContainerRef.current) {
        worldContainerRef.current.position.set(cam.x, cam.y);
      }
    }

    const parent = containerRef.current;
    if (parent && worldContainerRef.current) {
      const rect = parent.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const localX = (clientX - cam.x) / cam.zoom;
      const localY = (clientY - cam.y) / cam.zoom;

      const tileCoord = GridManager.isoToGrid(localX, localY);
      if (gridManager.posicaoValida(tileCoord.x, tileCoord.y)) {
        setHoverTile({ x: tileCoord.x, y: tileCoord.y });
      } else {
        setHoverTile(null);
      }
    }
  };

  const handlePointerUp = () => {
    const cam = cameraRef.current;
    cam.isDragging = false;

    if (!cam.hasMoved && hoverTile) {
      onTileClick(hoverTile.x, hoverTile.y);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const cam = cameraRef.current;
    const parent = containerRef.current;
    if (!parent || !worldContainerRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const novoZoom = Math.min(2.5, Math.max(0.45, cam.zoom * zoomFactor));

    const rect = parent.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    cam.x = mouseX - (mouseX - cam.x) * (novoZoom / cam.zoom);
    cam.y = mouseY - (mouseY - cam.y) * (novoZoom / cam.zoom);
    cam.zoom = novoZoom;

    worldContainerRef.current.position.set(cam.x, cam.y);
    worldContainerRef.current.scale.set(cam.zoom);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      cameraRef.current.initialPinchDistance = dist;
      cameraRef.current.initialZoom = cameraRef.current.zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

      const ratio = dist / (cameraRef.current.initialPinchDistance || dist);
      const novoZoom = Math.min(2.5, Math.max(0.45, cameraRef.current.initialZoom * ratio));

      cameraRef.current.zoom = novoZoom;
      if (worldContainerRef.current) {
        worldContainerRef.current.scale.set(novoZoom);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden select-none touch-none"
    />
  );
};

function desenharEdificacaoFantasma(
  g: Graphics,
  cx: number,
  cy: number,
  construcao: ItemCatalogoConstrucao,
  valido: boolean
) {
  const h = construcao.alturaPrismatica || 20;
  const pw = 16;
  const ph = 8;
  const bx = cx;
  const by = cy + 2;

  const cor = valido ? 0x10b981 : 0xef4444;

  g.poly([
    bx - pw, by,
    bx, by + ph,
    bx, by + ph - h,
    bx - pw, by - h,
  ]).fill({ color: cor, alpha: 0.25 });

  g.poly([
    bx, by + ph,
    bx + pw, by,
    bx + pw, by - h,
    bx, by + ph - h,
  ]).fill({ color: cor, alpha: 0.35 });

  g.poly([
    bx, by - ph - h,
    bx + pw, by - h,
    bx, by + ph - h,
    bx - pw, by - h,
  ])
    .fill({ color: cor, alpha: 0.45 })
    .stroke({ width: 1.5, color: cor, alpha: 0.8 });
}
