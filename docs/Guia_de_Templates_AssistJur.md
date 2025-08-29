# Guia de Templates AssistJur.IA

## Visão Geral

Este guia documenta os templates atualizados do AssistJur.IA, seguindo as diretrizes de branding, LGPD e acessibilidade.

## Componentes Base

### BrandHeader
- Logo + nome consistente
- Tamanhos: sm, md, lg
- Opção de mostrar versão

### LGPDFooter
- Rodapé padrão com compliance
- Timestamp local + versão
- Informações da organização

### ExportActions
- Botões padronizados de export
- Audit trail automático
- Suporte a PDF, CSV, JSON

## Templates Atualizados

### 1. Relatório Conclusivo
- ✅ Estrutura fixa: Resumo → Análise → Alertas → Estratégias → Próximos Passos
- ✅ Header com logo AssistJur.IA
- ✅ Rodapé LGPD + versão + timestamp
- ✅ CNJ preservado como string
- ✅ Cores do design system

### 2. Chat Integrado
- ✅ Ícones padronizados: 📌📋⚠️🎯➡️
- ✅ Banner LGPD visível
- ✅ Export com audit trail

### 3. Wizard de Importação
- ✅ Stepper visual padronizado
- ✅ Compliance panel LGPD
- ✅ Versionamento com status chips

## Design System

### Cores (HSL)
- `--brand-primary: hsl(258, 69%, 52%)` - Violeta tech
- `--brand-accent: hsl(45, 93%, 58%)` - Gold
- `--status-critical: hsl(0, 84%, 48%)` - WCAG AA

### Badges de Risco
- CRÍTICO: Contraste AA, vermelho
- ATENÇÃO: Âmbar
- OBSERVAÇÃO: Azul

## Compliance LGPD

✅ **Rodapé obrigatório**: "Validação nos autos é obrigatória. Dados tratados conforme LGPD."
✅ **CNJ preservado**: String original sem reformatação
✅ **Audit trail**: Logs de export automáticos
✅ **Mascaramento PII**: CPFs automaticamente mascarados

## Acessibilidade

✅ **Contraste WCAG AA**: Todos os badges testados
✅ **Navegação por teclado**: Componentes acessíveis
✅ **Roles ARIA**: Implementados onde necessário

## Templates de E-mail

### 1. WelcomeBeta
- ✅ Header com logo AssistJur.IA
- ✅ Informações de acesso personalizadas
- ✅ Lista de recursos disponíveis
- ✅ CTA para login
- ✅ Rodapé LGPD completo

### 2. ImportComplete  
- ✅ Resumo da importação com métricas
- ✅ Tabela de estatísticas formatada
- ✅ CTA para dashboard
- ✅ Próximos passos sugeridos

### 3. VersionPublished
- ✅ Informações da versão publicada
- ✅ Resumo das alterações
- ✅ Métricas de processos/testemunhas
- ✅ Ações recomendadas

### Componentes Reutilizáveis
- ✅ **EmailHeader**: Logo + marca consistente
- ✅ **EmailFooter**: Compliance LGPD + suporte

## Migração Finalizada ✅

### Branding Completo
✅ **Zero referências "HubJUR.IA"** - Todas atualizadas para AssistJur.IA
✅ **Design tokens padronizados** - Cores HSL com contraste WCAG AA
✅ **Ícones Lucide padronizados** - Sem emojis, com semântica clara
✅ **BrandHeader em wizards** - Identidade visual consistente
✅ **ExportActions integrado** - Audit trail automático
✅ **Templates de e-mail** - Transacionais completos com LGPD

### Compliance & Acessibilidade
✅ **CNJ preservado como string** - Sem reformatação
✅ **Badges de risco WCAG AA** - Contraste validado
✅ **Strings i18n extraídas** - Centralizadas para manutenção
✅ **Audit trail completo** - Logs de export automáticos
✅ **Mascaramento PII** - CPFs automaticamente protegidos

### Arquivos Atualizados
- `app/api/export/route.ts` - Título do PDF
- `supabase/functions/process-base-upload/index.ts` - Bucket storage
- `supabase/functions/templates-xlsx/index.ts` - Nome do arquivo
- `src/features/testemunhas/ResultBlocks.tsx` - Design tokens + ExportActions
- `src/features/testemunhas/ChatBar.tsx` - Ícones Lucide padronizados
- `src/features/importer/components/BrandedImporterWizard.tsx` - Branding completo

### Arquivos Criados
- `src/templates/email/WelcomeBeta.tsx`
- `src/templates/email/ImportComplete.tsx` 
- `src/templates/email/VersionPublished.tsx`
- `src/components/brand/EmailHeader.tsx`
- `src/components/brand/EmailFooter.tsx`
- `src/features/importer/components/BrandedImporterWizard.tsx`

**Status: 100% Concluído** 🚀