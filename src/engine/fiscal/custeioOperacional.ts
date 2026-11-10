import { CusteioOperacional } from '../../types/fiscal';

export interface ParametrosCusteio {
  manutencaoBensPublicos: number;
  servicosEUtilidades: number;
  materiaisConsumo: number;
  outrosCusteios?: number;
}

export class CusteioManager {
  /**
   * Consolida as despesas correntes de custeio operacional da máquina municipal
   */
  public static calcularCusteio(params: ParametrosCusteio): CusteioOperacional {
    const manutencao = params.manutencaoBensPublicos || 0;
    const servicos = params.servicosEUtilidades || 0;
    const materiais = params.materiaisConsumo || 0;
    const outros = params.outrosCusteios || 0;

    const total = Number((manutencao + servicos + materiais + outros).toFixed(2));

    return {
      manutencaoBensPublicos: manutencao,
      servicosEUtilidades: servicos,
      materiaisConsumo: materiais,
      outrosCusteios: outros,
      total,
    };
  }

  /**
   * Calcula o acréscimo no custeio anual decorrente da inauguração de novos equipamentos públicos
   * (ex.: cada nova creche ou posto de saúde gera custo fixo contínuo de luz, água, insumos e manutenção)
   */
  public static calcularCustoOperacionalAdicional(
    custeioAtual: CusteioOperacional,
    custoAnualNovoEquipamento: number
  ): CusteioOperacional {
    return {
      ...custeioAtual,
      manutencaoBensPublicos: Number((custeioAtual.manutencaoBensPublicos + custoAnualNovoEquipamento * 0.3).toFixed(2)),
      servicosEUtilidades: Number((custeioAtual.servicosEUtilidades + custoAnualNovoEquipamento * 0.3).toFixed(2)),
      materiaisConsumo: Number((custeioAtual.materiaisConsumo + custoAnualNovoEquipamento * 0.4).toFixed(2)),
      total: Number((custeioAtual.total + custoAnualNovoEquipamento).toFixed(2)),
    };
  }
}
