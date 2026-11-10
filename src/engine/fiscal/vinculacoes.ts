import {
  VinculacaoSetorial,
  VinculacoesObrigatorias,
} from '../../types/fiscal';

export class VinculacoesManager {
  /** Mínimo Constitucional da Saúde: 15% (CF/88 Art. 198, § 2º, III e LC 141/2012) */
  public static readonly PERCENTUAL_MINIMO_SAUDE = 15.0;

  /** Mínimo Constitucional da Educação: 25% (CF/88 Art. 212) */
  public static readonly PERCENTUAL_MINIMO_EDUCACAO = 25.0;

  /**
   * Avalia a aplicação em Saúde (Ações e Serviços Públicos de Saúde - ASPS)
   */
  public static calcularVinculacaoSaude(
    baseConstitucional: number,
    gastoEfetivoSaude: number
  ): VinculacaoSetorial {
    const valorMinimoExigido = Number(
      ((baseConstitucional * VinculacoesManager.PERCENTUAL_MINIMO_SAUDE) / 100).toFixed(2)
    );

    const percentualAtingido = baseConstitucional > 0
      ? Number(((gastoEfetivoSaude / baseConstitucional) * 100).toFixed(2))
      : 0;

    const diferenca = Number((gastoEfetivoSaude - valorMinimoExigido).toFixed(2));
    const cumprido = gastoEfetivoSaude >= valorMinimoExigido;

    return {
      setor: 'SAUDE',
      percentualMinimoObrigatorio: VinculacoesManager.PERCENTUAL_MINIMO_SAUDE,
      baseCalculo: baseConstitucional,
      valorMinimoExigido,
      valorAplicadoEfetivo: gastoEfetivoSaude,
      percentualAtingido,
      cumprido,
      diferenca,
    };
  }

  /**
   * Avalia a aplicação em Educação (Manutenção e Desenvolvimento do Ensino - MDE)
   */
  public static calcularVinculacaoEducacao(
    baseConstitucional: number,
    gastoEfetivoEducacao: number
  ): VinculacaoSetorial {
    const valorMinimoExigido = Number(
      ((baseConstitucional * VinculacoesManager.PERCENTUAL_MINIMO_EDUCACAO) / 100).toFixed(2)
    );

    const percentualAtingido = baseConstitucional > 0
      ? Number(((gastoEfetivoEducacao / baseConstitucional) * 100).toFixed(2))
      : 0;

    const diferenca = Number((gastoEfetivoEducacao - valorMinimoExigido).toFixed(2));
    const cumprido = gastoEfetivoEducacao >= valorMinimoExigido;

    return {
      setor: 'EDUCACAO',
      percentualMinimoObrigatorio: VinculacoesManager.PERCENTUAL_MINIMO_EDUCACAO,
      baseCalculo: baseConstitucional,
      valorMinimoExigido,
      valorAplicadoEfetivo: gastoEfetivoEducacao,
      percentualAtingido,
      cumprido,
      diferenca,
    };
  }

  /**
   * Consolida a verificação dos dois pisos constitucionais
   */
  public static calcularVinculacoesObrigatorias(
    baseConstitucional: number,
    gastoSaude: number,
    gastoEducacao: number
  ): VinculacoesObrigatorias {
    const saude = VinculacoesManager.calcularVinculacaoSaude(baseConstitucional, gastoSaude);
    const educacao = VinculacoesManager.calcularVinculacaoEducacao(baseConstitucional, gastoEducacao);

    return {
      saude,
      educacao,
      ambasCumpridas: saude.cumprido && educacao.cumprido,
    };
  }
}
