# BetaSignup Component

Componente reutilizável para captura de leads do AssistJur.IA com formulário inline e funcionalidade completa.

## Uso Básico

```tsx
import { BetaSignup } from '@/components/beta/BetaSignup';

// Formulário inline (padrão)
<BetaSignup />

// Formulário em card com borda
<BetaSignup variant="card" />

// Versão compacta (sem campo cargo)
<BetaSignup compact />
```

## Props

- `compact?: boolean` - Remove o campo cargo para versão mais enxuta
- `className?: string` - Classes CSS customizadas
- `variant?: 'inline' | 'card'` - Estilo de apresentação

## Estados

1. **Default**: Formulário de captura
2. **Submitting**: Loading durante envio
3. **Success**: Tela de agradecimento com botões LinkedIn/Whitepaper
4. **Error**: Feedback de erro com opção de tentar novamente

## Validações

- Nome: mínimo 3 caracteres
- Email: formato válido, sugestão para email corporativo
- Organização: mínimo 2 caracteres
- Necessidades: pelo menos 1 selecionada
- Outro texto: máximo 120 caracteres (quando aplicável)

## Backend

- Edge function: `supabase/functions/beta-signup`
- Tabela: `beta_signups`
- Fallback: mock com toast de sucesso se API indisponível

## Features

- ✅ Acessibilidade AA compliant
- ✅ Responsive design
- ✅ Validação com Zod
- ✅ Estados de loading e sucesso
- ✅ Tracking de eventos
- ✅ LGPD compliant
- ✅ Fallback para mock quando API indisponível

## Eventos Disparados

- `beta_form_opened`
- `beta_form_submitted`
- `beta_form_success`
- `beta_form_error`

## Dependências

- React Hook Form
- Zod (validação)
- Tailwind CSS
- shadcn/ui
- Lucide React (ícones)
