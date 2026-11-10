import { GridManager } from './gridManager';
import { MetricasUrbanaCalculadas, TileData } from '../../types/city';

export class CityMetricsCalculator {
  /**
   * Calcula as métricas globais e atualiza os mapas de calor de saúde, educação,
   * saneamento e atratividade em cada lote do grid
   */
  public static calcularMetricas(gridManager: GridManager): MetricasUrbanaCalculadas {
    const grid = gridManager.getGrid();
    const tamanho = gridManager.tamanho;

    // 1. Zera/Reseta índices locais antes de propagar influência
    for (let y = 0; y < tamanho; y++) {
      for (let x = 0; x < tamanho; x++) {
        const t = grid[y][x];
        t.nivelSaude = 5;
        t.nivelEducacao = 5;
        t.nivelSaneamento = 5;
        t.nivelAtratividade = t.conectadoRua ? 20 : 5;
      }
    }

    // 2. Coleta de equipamentos e contadores por tier
    const prediosPublicos: { tile: TileData; x: number; y: number }[] = [];
    const habitacoes: { tile: TileData; x: number; y: number; hab: number }[] = [];
    const comercios: { tile: TileData; x: number; y: number }[] = [];

    let totalResidencialTier1 = 0;
    let totalResidencialTier2 = 0;
    let totalResidencialTier3 = 0;
    let totalComercialTier1 = 0;
    let totalComercialTier2 = 0;
    let totalComercialTier3 = 0;
    let totalIndustrial = 0;
    let totalCorticosDegradados = 0;

    for (let y = 0; y < tamanho; y++) {
      for (let x = 0; x < tamanho; x++) {
        const tile = grid[y][x];
        if (!tile.construcao) continue;

        const c = tile.construcao;

        if (c.categoria === 'RESIDENCIAL') {
          let moradores = 4;
          if (c.id === 'casa-popular') {
            moradores = 4;
            totalResidencialTier1++;
          } else if (c.id === 'sobrado-residencial') {
            moradores = 8;
            totalResidencialTier2++;
          } else if (c.id === 'edificio-residencial') {
            moradores = 45;
            totalResidencialTier3++;
          } else if (c.id === 'cortico-degradado') {
            moradores = 12;
            totalCorticosDegradados++;
          }
          habitacoes.push({ tile, x, y, hab: moradores });
        } else if (c.categoria === 'COMERCIAL') {
          if (c.id === 'comercio-bairro') totalComercialTier1++;
          else if (c.id === 'galeria-comercial') totalComercialTier2++;
          else if (c.id === 'centro-empresarial') totalComercialTier3++;
          comercios.push({ tile, x, y });
        } else if (c.categoria === 'INDUSTRIAL') {
          totalIndustrial++;
        } else if (c.custoCapital > 0 || c.id === 'prefeitura-historica') {
          prediosPublicos.push({ tile, x, y });
        }
      }
    }

    // Propaga efeitos de raio dos equipamentos públicos
    for (const pub of prediosPublicos) {
      const c = pub.tile.construcao!;
      const raio = c.raioInfluencia || 4;

      for (let dy = -raio; dy <= raio; dy++) {
        for (let dx = -raio; dx <= raio; dx++) {
          const nx = pub.x + dx;
          const ny = pub.y + dy;

          if (gridManager.posicaoValida(nx, ny)) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= raio) {
              const fator = 1 - dist / (raio + 1);
              const target = grid[ny][nx];

              if (c.impactoSaude) {
                target.nivelSaude = Math.min(100, Math.round(target.nivelSaude + c.impactoSaude * fator));
              }
              if (c.impactoEducacao) {
                target.nivelEducacao = Math.min(100, Math.round(target.nivelEducacao + c.impactoEducacao * fator));
              }
              if (c.impactoSaneamento) {
                target.nivelSaneamento = Math.min(100, Math.round(target.nivelSaneamento + c.impactoSaneamento * fator));
              }
              if (c.impactoAtratividade) {
                target.nivelAtratividade = Math.min(100, Math.round(target.nivelAtratividade + c.impactoAtratividade * fator));
              }
            }
          }
        }
      }
    }

    // 3. Apuração da População e Cobertura
    let populacaoTotal = 0;
    let populacaoComSaude = 0;
    let populacaoComEducacao = 0;
    let populacaoComSaneamento = 0;
    let habitacoesConectadas = 0;
    let valorVenalTotal = 0;

    for (const hab of habitacoes) {
      populacaoTotal += hab.hab;
      if (hab.tile.nivelSaude >= 25) populacaoComSaude += hab.hab;
      if (hab.tile.nivelEducacao >= 25) populacaoComEducacao += hab.hab;
      if (hab.tile.nivelSaneamento >= 25) populacaoComSaneamento += hab.hab;
      if (hab.tile.conectadoRua) habitacoesConectadas++;

      // Atualiza valor venal do imóvel (quanto melhor o saneamento e infra, maior o IPTU)
      let valorBase = 120_000;
      if (hab.tile.construcaoId === 'sobrado-residencial') valorBase = 280_000;
      else if (hab.tile.construcaoId === 'edificio-residencial') valorBase = 850_000;
      else if (hab.tile.construcaoId === 'cortico-degradado') valorBase = 40_000;

      const bonusQualidade = 1 + (hab.tile.nivelSaneamento + hab.tile.nivelSaude + hab.tile.nivelEducacao) / 300;
      hab.tile.valorVenalIPTU = Math.round(valorBase * bonusQualidade);
      valorVenalTotal += hab.tile.valorVenalIPTU;
    }

    const totalHab = Math.max(1, habitacoes.length);
    const popValida = Math.max(1, populacaoTotal);

    const coberturaSaude = Math.round((populacaoComSaude / popValida) * 100);
    const coberturaEducacao = Math.round((populacaoComEducacao / popValida) * 100);
    const coberturaSaneamento = Math.round((populacaoComSaneamento / popValida) * 100);
    const eficienciaMobilidade = Math.round((habitacoesConectadas / totalHab) * 100);

    const qualidadeVida = Math.round(
      coberturaSaude * 0.3 +
      coberturaEducacao * 0.3 +
      coberturaSaneamento * 0.25 +
      eficienciaMobilidade * 0.15
    );

    const potencialIPTU = Math.round(valorVenalTotal * 0.012);
    const potencialISS = Math.round(
      (totalComercialTier1 * 80_000 + totalComercialTier2 * 220_000 + totalComercialTier3 * 750_000 + totalIndustrial * 150_000) *
      (1 + qualidadeVida / 200)
    );

    return {
      populacaoTotal: Math.max(populacaoTotal, 500),
      densidadeMedia: Number((populacaoTotal / (tamanho * tamanho)).toFixed(1)),
      coberturaSaudePercentual: Math.min(100, coberturaSaude),
      coberturaEducacaoPercentual: Math.min(100, coberturaEducacao),
      coberturaSaneamentoPercentual: Math.min(100, coberturaSaneamento),
      eficienciaMobilidadePercentual: Math.min(100, eficienciaMobilidade),
      qualidadeVidaGeral: Math.min(100, qualidadeVida),
      potencialArrecadacaoIPTU: potencialIPTU,
      potencialArrecadacaoISS: potencialISS,
      totalResidencialTier1,
      totalResidencialTier2,
      totalResidencialTier3,
      totalComercialTier1,
      totalComercialTier2,
      totalComercialTier3,
      totalIndustrial,
      totalCorticosDegradados,
    };
  }
}
