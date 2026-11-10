# SimPrefeito - Jogo Educativo de Simulação e Gestão Fiscal Urbana

**SimPrefeito** é um simulador mobile-friendly de finanças públicas municipais e gestão urbana educativa construído com **Vite + React + TypeScript + Tailwind CSS**, concebido com arquitetura desacoplada e motor fiscal headless em conformidade estrita com a **Lei de Responsabilidade Fiscal (LC nº 101/2000)**, **Constituição Federal de 1988** e a **Lei Federal nº 4.320/1964**.

---

## 🏛️ Arquitetura do Projeto

```
src/
├── engine/                  # Motor headless de simulação (puro TypeScript, zero dependência de DOM)
│   ├── fiscal/              # Regras orçamentárias (RCL, limites LRF, mínimos constitucionais, custeio e margem)
│   ├── planning/            # Estruturas de PPA, LDO e LOA anualizada
│   └── simulation/          # Avanço temporal (meses/turnos), acumuladores anuais e decisões políticas
├── components/              # Componentes visuais React (Dashboard LRF, Planejamento PPA/LOA, Gabinete)
├── lib/                     # Utilitários de formatação de moeda brasileira e cn (clsx + tailwind-merge)
├── types/                   # Interfaces e tipos de domínio rigorosamente tipados
└── __tests__/               # Suíte completa de testes automatizados com Vitest
```

---

## 📐 Regras Fiscais Modeladas

1. **Receita Corrente Líquida (RCL - Art. 2º, IV da LRF):**
   - Somatório de Tributos Municipais (`IPTU`, `ISS`, `ITBI`, `Taxas`, `COSIP`) e Transferências Correntes (`FPM`, `Cota-Parte ICMS`, `Cota-Parte IPVA`, `Fundeb`, etc.).
   - Aplicação automática da retenção legal de **20% para formação do Fundeb** sobre FPM, ICMS, IPVA, ITR e IPI-Exportação.

2. **Limites de Despesa com Pessoal (Executivo Municipal - LRF Art. 19 e 20):**
   - 🟡 **Limite de Alerta (48,60% da RCL):** Notificação emitida pelo Tribunal de Contas (art. 59, § 1º, II).
   - 🟠 **Limite Prudencial (51,30% da RCL):** Ativação imediata de vedações (proibição de reajustes salariais, horas extras e criação de cargos).
   - 🔴 **Limite Máximo (54,00% da RCL):** Violação grave com exigência de corte de comissionados em pelo menos 20% e bloqueio de transferências voluntárias.

3. **Pisos Constitucionais Obrigatórios:**
   - 🏥 **Saúde:** Mínimo de **15,0%** sobre a receita de impostos e transferências constitucionais (CF/88 Art. 198, § 2º, III e LC 141/2012).
   - 🎓 **Educação:** Mínimo de **25,0%** sobre a receita de impostos em Manutenção e Desenvolvimento do Ensino (CF/88 Art. 212 e EC 108/2020).

4. **Rigidez Orçamentária e Margem de Investimentos:**
   - Saldo livre disponível para despesas de capital após cobrir folha líquida e custeio operacional básico.

5. **Ciclo de Planejamento Integrado:**
   - **PPA (Plano Plurianual):** 4 anos de duração com Programas Temáticos, Metas Físicas e Metas Financeiras.
   - **LDO (Lei de Diretrizes Orçamentárias):** Fixação de metas fiscais e prioridades anuais.
   - **LOA (Lei Orçamentária Anual):** Desdobrada em Orçamento Fiscal e Seguridade Social, executando os estágios de Empenho, Liquidação e Pagamento.

---

## 🚀 Executando o Projeto

### Testes Automatizados
```bash
npm test
```

### Ambiente de Desenvolvimento
```bash
npm run dev
```

### Build de Produção
```bash
npm run build
```
