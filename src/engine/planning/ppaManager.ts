import { PPA, ProgramaTematico } from '../../types/planning';

export class PPAManager {
  /**
   * Cria uma estrutura padrão de PPA com programas temáticos essenciais para uma cidade brasileira
   */
  public static criarPPAPadrao(anoInicio: number = 2025, nomeCidade: string = 'Nova Esperança'): PPA {
    const programas: ProgramaTematico[] = [
      {
        id: 'prog-saude',
        codigo: '1001',
        nome: 'Atenção Primária e Saúde para Todos',
        descricao: 'Fortalecimento da rede básica de saúde, ampliação das equipes de Saúde da Família e modernização das UBSs.',
        objetivoEstrategico: 'Garantir cobertura de 95% da atenção básica e reduzir o tempo de espera para consultas especializadas.',
        orgaoResponsavel: 'Secretaria Municipal de Saúde',
        setor: 'SAUDE',
        metasFisicas: [
          {
            id: 'meta-ubs',
            indicador: 'Novas Unidades Básicas de Saúde (UBS) construídas e equipadas',
            unidadeMedida: 'unidades',
            metaQuadrienal: 4,
            metasAnuais: [1, 1, 1, 1],
            executadoAnual: [0, 0, 0, 0],
          },
          {
            id: 'meta-cobertura-esf',
            indicador: 'Cobertura da Estratégia de Saúde da Família (ESF)',
            unidadeMedida: '% da população',
            metaQuadrienal: 95,
            metasAnuais: [80, 85, 90, 95],
            executadoAnual: [0, 0, 0, 0],
          },
        ],
        metaFinanceira: {
          custoTotalPlurianual: 120_000_000,
          previsaoAnual: [28_000_000, 29_500_000, 31_000_000, 31_500_000],
          executadoAnual: [0, 0, 0, 0],
        },
        acoes: [
          {
            id: 'acao-ubs-const',
            codigoAcao: '1010',
            titulo: 'Construção e Reforma de UBSs e UPAs',
            descricao: 'Obras de infraestrutura física e instalações hospitalares.',
            tipo: 'PROJETO',
            natureza: 'CAPITAL',
            custoAnual: 4_500_000,
            setor: 'SAUDE',
          },
          {
            id: 'acao-saude-manutencao',
            codigoAcao: '2020',
            titulo: 'Manutenção dos Serviços de Atenção Básica',
            descricao: 'Salários dos médicos, enfermeiros e medicamentos da farmácia básica.',
            tipo: 'ATIVIDADE',
            natureza: 'CORRENTE',
            custoAnual: 24_500_000,
            setor: 'SAUDE',
          },
        ],
      },
      {
        id: 'prog-educacao',
        codigo: '1002',
        nome: 'Educação Básica e Primeira Infância',
        descricao: 'Universalização da educação infantil (creches e pré-escolas), valorização do magistério e transporte escolar.',
        objetivoEstrategico: 'Zerar a fila de espera em creches e elevar o IDEB municipal para 6.8.',
        orgaoResponsavel: 'Secretaria Municipal de Educação',
        setor: 'EDUCACAO',
        metasFisicas: [
          {
            id: 'meta-creches',
            indicador: 'Novos Centros Municipais de Educação Infantil (CMEI) entregues',
            unidadeMedida: 'escolas',
            metaQuadrienal: 6,
            metasAnuais: [1, 2, 2, 1],
            executadoAnual: [0, 0, 0, 0],
          },
          {
            id: 'meta-ideb',
            indicador: 'Índice de Desenvolvimento da Educação Básica (IDEB)',
            unidadeMedida: 'pontos',
            metaQuadrienal: 6.8,
            metasAnuais: [5.8, 6.1, 6.5, 6.8],
            executadoAnual: [0, 0, 0, 0],
          },
        ],
        metaFinanceira: {
          custoTotalPlurianual: 160_000_000,
          previsaoAnual: [38_000_000, 39_500_000, 41_000_000, 41_500_000],
          executadoAnual: [0, 0, 0, 0],
        },
        acoes: [
          {
            id: 'acao-cmei-const',
            codigoAcao: '1021',
            titulo: 'Construção e Ampliação de Creches e Escolas',
            descricao: 'Expansão da rede física escolar municipal.',
            tipo: 'PROJETO',
            natureza: 'CAPITAL',
            custoAnual: 6_000_000,
            setor: 'EDUCACAO',
          },
          {
            id: 'acao-educ-fundeb',
            codigoAcao: '2030',
            titulo: 'Manutenção do Ensino Fundamental e Infantil com Fundeb',
            descricao: 'Folha de pagamento dos professores e profissionais da educação.',
            tipo: 'ATIVIDADE',
            natureza: 'CORRENTE',
            custoAnual: 33_000_000,
            setor: 'EDUCACAO',
          },
        ],
      },
      {
        id: 'prog-infraestrutura',
        codigo: '1003',
        nome: 'Infraestrutura Urbana, Drenagem e Mobilidade',
        descricao: 'Pavimentação de vias, contenção de encostas, drenagem pluvial e modernização da iluminação pública.',
        objetivoEstrategico: 'Asfaltar 100% das vias habitadas e eliminar áreas de risco de inundações.',
        orgaoResponsavel: 'Secretaria Municipal de Obras e Serviços Públicos',
        setor: 'INFRAESTRUTURA',
        metasFisicas: [
          {
            id: 'meta-asfalto',
            indicador: 'Extensão de vias pavimentadas com drenagem pluvial',
            unidadeMedida: 'km',
            metaQuadrienal: 60,
            metasAnuais: [10, 15, 20, 15],
            executadoAnual: [0, 0, 0, 0],
          },
          {
            id: 'meta-led',
            indicador: 'Pontos de iluminação pública convertidos para LED (Eficiência Energética)',
            unidadeMedida: 'pontos',
            metaQuadrienal: 8000,
            metasAnuais: [2000, 2000, 2000, 2000],
            executadoAnual: [0, 0, 0, 0],
          },
        ],
        metaFinanceira: {
          custoTotalPlurianual: 80_000_000,
          previsaoAnual: [18_000_000, 21_000_000, 22_000_000, 19_000_000],
          executadoAnual: [0, 0, 0, 0],
        },
        acoes: [
          {
            id: 'acao-pavimentacao',
            codigoAcao: '1035',
            titulo: 'Programa Asfalto Novo e Drenagem Sustentável',
            descricao: 'Execução de obras de pavimentação asfáltica e galerias pluviais.',
            tipo: 'PROJETO',
            natureza: 'CAPITAL',
            custoAnual: 14_000_000,
            setor: 'INFRAESTRUTURA',
          },
          {
            id: 'acao-tapa-buraco',
            codigoAcao: '2045',
            titulo: 'Conservação e Manutenção da Malha Viária e Iluminação',
            descricao: 'Operações tapa-buracos, recapeamento e manutenção da iluminação.',
            tipo: 'ATIVIDADE',
            natureza: 'CORRENTE',
            custoAnual: 5_000_000,
            setor: 'INFRAESTRUTURA',
          },
        ],
      },
      {
        id: 'prog-gestao',
        codigo: '1004',
        nome: 'Gestão Eficiente, Modernização e Cidadania',
        descricao: 'Digitalização de serviços públicos municipais, desburocratização e governança.',
        objetivoEstrategico: 'Alcançar 100% dos serviços públicos solicitáveis por smartphone.',
        orgaoResponsavel: 'Secretaria Municipal de Administração e Finanças',
        setor: 'ADMINISTRACAO',
        metasFisicas: [
          {
            id: 'meta-servicos-digitais',
            indicador: 'Processos administrativos convertidos para formato 100% digital',
            unidadeMedida: '% processos',
            metaQuadrienal: 100,
            metasAnuais: [40, 70, 90, 100],
            executadoAnual: [0, 0, 0, 0],
          },
        ],
        metaFinanceira: {
          custoTotalPlurianual: 40_000_000,
          previsaoAnual: [9_500_000, 10_000_000, 10_200_000, 10_300_000],
          executadoAnual: [0, 0, 0, 0],
        },
        acoes: [
          {
            id: 'acao-ti-gestao',
            codigoAcao: '1050',
            titulo: 'Transformação Digital da Prefeitura (Prefeitura Sem Papel)',
            descricao: 'Modernização de datacenters e desenvolvimento de aplicativo do cidadão.',
            tipo: 'PROJETO',
            natureza: 'CAPITAL',
            custoAnual: 2_500_000,
            setor: 'ADMINISTRACAO',
          },
          {
            id: 'acao-adm-manutencao',
            codigoAcao: '2060',
            titulo: 'Manutenção dos Serviços Administrativos Gerais',
            descricao: 'Folha da administração direta e suprimentos de gabinete.',
            tipo: 'ATIVIDADE',
            natureza: 'CORRENTE',
            custoAnual: 7_300_000,
            setor: 'ADMINISTRACAO',
          },
        ],
      },
    ];

    const custoTotalQuadrienal = programas.reduce(
      (acc, prog) => acc + prog.metaFinanceira.custoTotalPlurianual,
      0
    );

    return {
      id: `ppa-${anoInicio}-${anoInicio + 3}`,
      nome: `Plano Plurianual ${anoInicio}-${anoInicio + 3} - Município de ${nomeCidade}`,
      anoInicio,
      anoFim: anoInicio + 3,
      descricao: `Instrumento de planejamento estratégico de médio prazo que estabelece as diretrizes, objetivos e metas da administração municipal para o quadriênio ${anoInicio}-${anoInicio + 3}.`,
      programas,
      custoTotalQuadrienal,
    };
  }

  /**
   * Atualiza a execução física e financeira de uma meta do PPA
   */
  public static registrarProgresso(
    ppa: PPA,
    programaId: string,
    anoMandato: 1 | 2 | 3 | 4,
    executadoFisico: number,
    executadoFinanceiro: number
  ): PPA {
    const anoIndex = anoMandato - 1;

    const programasAtualizados = ppa.programas.map((prog) => {
      if (prog.id !== programaId) return prog;

      const novaPrevisao = [...prog.metaFinanceira.executadoAnual] as [number, number, number, number];
      novaPrevisao[anoIndex] = Number((novaPrevisao[anoIndex] + executadoFinanceiro).toFixed(2));

      const metasFisicasAtualizadas = prog.metasFisicas.map((meta) => {
        const novoExec = [...meta.executadoAnual] as [number, number, number, number];
        novoExec[anoIndex] = Number((novoExec[anoIndex] + executadoFisico).toFixed(2));
        return {
          ...meta,
          executadoAnual: novoExec,
        };
      });

      return {
        ...prog,
        metaFinanceira: {
          ...prog.metaFinanceira,
          executadoAnual: novaPrevisao,
        },
        metasFisicas: metasFisicasAtualizadas,
      };
    });

    return {
      ...ppa,
      programas: programasAtualizados,
    };
  }
}
