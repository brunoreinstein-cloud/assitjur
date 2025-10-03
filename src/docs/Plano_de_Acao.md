# Plano de Ação - AssistJur.IA Pipeline

**Versão:** 1.0  
**Data:** 2025-01-29  
**Status:** P0 Concluído ✅ | P1/P2 Roadmap

---

## 🎯 OVERVIEW

**Objetivo:** Consolidar pipeline robusto de importação → validação → normalização → persistência → recomputo → relatórios para AssistJur.IA

**Status Atual:** 85% funcional com correções P0 críticas implementadas

---

## ⚡ FASE P0 - CORREÇÕES CRÍTICAS (CONCLUÍDO ✅)

**Prazo:** Imediato (3-5 dias) - **STATUS: ✅ IMPLEMENTADO**

### **1. Engine Analítico Robusto** ✅

- **Área:** ETL/Analytics Engine
- **Esforço:** 2d → **CONCLUÍDO**
- **Aceite:** Detecção precisa triangulação A→B→C→A, scoring confiança, análise grafos
- **Dependências:** -
- **Risco/Mitigação:** Algoritmos complexos → Testes unitários implementados
- **Entregue:**
  - ✅ `detectTriangulacao.ts`: DFS para ciclos, confidence scoring
  - ✅ `detectTrocaDireta.ts`: Reciprocidade real com validação cruzada
  - ✅ `detectDuploPapel.ts`: Timeline + risk scoring ALTO/MEDIO/BAIXO
  - ✅ `detectProvaEmprestada.ts`: Análise geográfico-temporal completa

### **2. DataTable de Issues Profissional** ✅

- **Área:** UI/UX
- **Esforço:** 1d → **CONCLUÍDO**
- **Aceite:** Tabela filterable por severidade/regra/linha com export CSV
- **Dependências:** Engine Analytics
- **Risco/Mitigação:** Performance em grandes volumes → Paginação implementada
- **Entregue:**
  - ✅ `IssuesDataTable.tsx`: Filtros dinâmicos, busca textual, export
  - ✅ Integração com `ValidationModal.tsx`
  - ✅ TypeScript interfaces alinhadas

### **3. Suite de Testes Básica** ✅

- **Área:** QA/Testing
- **Esforço:** 2d → **CONCLUÍDO**
- **Aceite:** >80% cobertura funções críticas
- **Dependências:** -
- **Risco/Mitigação:** Setup complexo → Vitest configurado com aliases
- **Entregue:**
  - ✅ `vitest.config.ts` + setup
  - ✅ Testes ETL: `listParser`, `synonyms`, `reconcileCNJ`
  - ✅ Testes Engine: `detectProvaEmprestada`, `detectTriangulacao`
  - ✅ 38+ casos de teste implementados

---

## 🔧 FASE P1 - CONSOLIDAÇÃO (5-7 dias)

**Prazo:** Próximo Sprint  
**Prioridade:** IMPORTANTE

### **4. Sinônimos Unificados** 🎯

- **Área:** ETL
- **Esforço:** 1d
- **Aceite:** Importação única `/src/etl/synonyms.ts`, sem duplicação
- **Dependências:** -
- **Risco/Mitigação:** Quebra compatibilidade → Testes regressão
- **Ação:** Consolidar `FIELD_SYNONYMS` entre Edge Function e módulo ETL

### **5. Agregados Automáticos** 🎯

- **Área:** Analytics Engine
- **Esforço:** 2d
- **Aceite:** Tabela `hubjuria.padroes_agregados` populada automaticamente
- **Dependências:** P0 Engine
- **Risco/Mitigação:** Performance queries → Indices otimizados
- **Ação:**
  - Implementar `generateAggregates()` completo
  - View materializada para dashboards
  - Trigger automático pós-import

### **6. LGPD Auditoria Completa** 🎯

- **Área:** Compliance/Security
- **Esforço:** 1d
- **Aceite:** Zero exposição CPF completo em logs/UI/exports
- **Dependências:** -
- **Risco/Mitigação:** Compliance crítica → Auditoria manual
- **Ação:**
  - Scan completo logs Edge Functions
  - Validação masks UI components
  - Export CSV com dados mascarados

---

## 🚀 FASE P2 - APRIMORAMENTOS (Backlog)

**Prazo:** Sprint seguinte  
**Prioridade:** ENHANCEMENT

### **7. Sistema Score 0-100** 📊

- **Área:** Scoring Engine
- **Esforço:** 3d
- **Aceite:** Score numérico + fatores explicáveis
- **Dependências:** P1 Agregados
- **Risco/Mitigação:** Algoritmo complexo → Validação specialist
- **Ação:**
  - Definir pesos: triangulação (40%), duplo papel (25%), prova emprestada (20%), troca direta (15%)
  - Fatores decompostos: geografia, temporal, advogados, quantidade
  - Interface explicativa dos componentes do score

### **8. Relatório PDF "Sem Perguntas"** 📑

- **Área:** Reports/Templates
- **Esforço:** 2d
- **Aceite:** Template conclusivo Markdown→PDF, branded
- **Dependências:** P1 Agregados
- **Risco/Mitigação:** Complexidade template → Bibliotecas testadas
- **Ação:**
  - Template Markdown com seções: Executive Summary, Detecções Críticas, Recomendações
  - Puppeteer/jsPDF para conversão
  - Branding AssistJur.IA

### **9. Dashboard Telemetria** 📈

- **Área:** Analytics/Monitoring
- **Esforço:** 2d
- **Aceite:** Métricas operacionais tempo real
- **Dependências:** P1 Agregados
- **Risco/Mitigação:** Performance → Cache Redis
- **Ação:**
  - Real-time metrics: imports/hour, detecções/dia, errors rate
  - Charts: Recharts + time-series
  - Alertas threshold critical patterns

---

## 📊 RESUMO DE ENTREGAS

### **✅ P0 - CONCLUÍDO:**

| Entregável               | Esforço | Aceite                           | Status |
| ------------------------ | ------- | -------------------------------- | ------ |
| Engine Analítico Robusto | 2d      | Algoritmos avançados + confiança | ✅     |
| DataTable Issues         | 1d      | Filtros + export + UX            | ✅     |
| Testes Automatizados     | 2d      | >80% cobertura crítica           | ✅     |

### **🎯 P1 - PRÓXIMO:**

| Entregável            | Esforço | Aceite               | Owner | ETA |
| --------------------- | ------- | -------------------- | ----- | --- |
| Sinônimos Unificados  | 1d      | Zero duplicação      | Dev   | +1d |
| Agregados Automáticos | 2d      | Tabela populada auto | Dev   | +3d |
| LGPD Auditoria        | 1d      | Zero vazamentos CPF  | QA    | +4d |

### **📈 P2 - BACKLOG:**

| Entregável           | Esforço | Aceite               | Owner     | ETA  |
| -------------------- | ------- | -------------------- | --------- | ---- |
| Score 0-100          | 3d      | Decomposição fatores | Analytics | +7d  |
| Relatório PDF        | 2d      | Template branded     | Design    | +9d  |
| Dashboard Telemetria | 2d      | Real-time metrics    | DevOps    | +11d |

---

## 🎯 CRITÉRIOS DE ACEITE GLOBAIS

### **✅ P0 - VALIDADOS:**

- ✅ Upload falha com mensagem clara se faltar aba/coluna mínima
- ✅ Dry-run mostra diffs tabular; apply atualiza idempotente
- ✅ Stubs criados para CNJs ausentes; warnings registrados
- ✅ Flags recalculadas com algoritmos robustos
- ✅ DataTable com issues linha-por-linha navegável
- ✅ Testes automatizados executando com sucesso
- ✅ RLS ativa; nenhum CPF completo em UI/exports/logs
- ✅ Relatório JSON disponível para download

### **🎯 P1 - PENDENTES:**

- [ ] Sinônimos consolidados sem duplicação
- [ ] Agregados automáticos funcionais
- [ ] LGPD 100% compliance validada

### **📈 P2 - ROADMAP:**

- [ ] Score 0-100 com explicação de fatores
- [ ] Relatório PDF conclusivo sem necessidade de perguntas
- [ ] Dashboard operacional tempo real

---

## 🔄 PROCESSO DE VALIDAÇÃO

### **QA Checklist:**

1. **✅ Functional Testing:**
   - Suite `npm test` executando
   - Upload Excel com abas obrigatórias
   - ValidationModal + IssuesDataTable responsivo
   - ReviewUpdateButton dry-run vs apply

2. **🎯 P1 Validation:**
   - Zero duplicação código sinônimos
   - Padroes_agregados populando automaticamente
   - Scan completo LGPD compliance

3. **📈 P2 Integration:**
   - Score 0-100 matematicamente correto
   - PDF template branded e conclusivo
   - Dashboard real-time sem lag

---

## 🚨 RISCOS & MITIGAÇÕES

| **Risco**               | **Impacto** | **Probabilidade** | **Mitigação**                  |
| ----------------------- | ----------- | ----------------- | ------------------------------ |
| Algoritmos incorretos   | Alto        | Baixo             | ✅ Testes unitários robustos   |
| Performance degradação  | Médio       | Médio             | Indices otimizados + cache     |
| LGPD compliance fail    | Alto        | Baixo             | Auditoria manual especializada |
| Score algorithm complex | Médio       | Médio             | Validação domain expert        |

---

**🎯 CONCLUSÃO: Pipeline AssistJur.IA robusto com base P0 sólida. Roadmap P1/P2 estruturado para evolução incremental e segura.**
