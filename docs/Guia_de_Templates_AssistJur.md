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

## Próximos Passos

1. Implementar templates de e-mail
2. Criar snapshots visuais
3. Testes automatizados de acessibilidade
4. Migração completa de referências legadas