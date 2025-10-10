# ✅ Sistema de Consentimento LGPD - AssistJur.IA

Este módulo gerencia o banner de consentimento conforme LGPD e o Google Consent Mode v2, com proteções SSR e conformidade total.

## 🏗️ Arquitetura

### Componentes Principais

- **`src/hooks/useConsent.ts`**: Hook principal com proteções SSR completas
- **`src/hooks/useConsentSafe.ts`**: Hook seguro para componentes que podem ser renderizados no servidor
- **`src/components/privacy/ConsentDialog.tsx`**: UI do banner com categorias Essenciais, Medição e Publicidade
- **`src/lib/consent.ts`**: Sistema unificado de gerenciamento de consentimento
- **`src/lib/consent-gates.ts`**: Gates de consentimento para integrações de terceiros
- **`src/middleware/consent.ts`**: Middleware para verificação de consentimento

### Categorias de Consentimento

1. **Essenciais** (sempre ativo)
   - Cookies de sessão
   - Autenticação
   - Segurança
   - Funcionalidades básicas

2. **Medição** (opt-in)
   - Google Analytics
   - Sentry (error tracking)
   - Métricas de performance
   - Análise de uso

3. **Publicidade** (opt-in)
   - Google Ads
   - Facebook Pixel
   - Remarketing
   - Personalização de anúncios

## 🔧 Funcionalidades

### ✅ Proteções SSR
- Detecção automática de ambiente servidor/cliente
- Fallbacks seguros para renderização no servidor
- Guards em todas as operações de DOM/storage

### ✅ Versionamento e Expiração
- Versão atual: `1.0.0`
- Expiração automática após 180 dias
- Re-exibição do banner em mudanças de versão

### ✅ Integrações Consent-Aware
- Sentry (error tracking)
- Google Analytics
- PostHog (analytics)
- Facebook Pixel
- Hotjar (heatmaps)
- Intercom (chat)

### ✅ Google Consent Mode v2
- Implementação completa do Consent Mode v2
- Sinalização para GTM
- Eventos no dataLayer

## 📝 Como Usar

### Hook Principal
```typescript
import { useConsent } from '@/hooks/useConsent';

function MyComponent() {
  const { preferences, open, setOpen, save } = useConsent();
  
  if (preferences?.analytics) {
    // Usuário consentiu com analytics
  }
}
```

### Hook Seguro (SSR)
```typescript
import { useConsentSafe } from '@/hooks/useConsentSafe';

function MyComponent() {
  const { preferences } = useConsentSafe();
  // Sempre funciona, mesmo no servidor
}
```

### Gates de Consentimento
```typescript
import { hasConsent, withConsentGate } from '@/lib/consent-gates';

// Verificar consentimento
if (hasConsent('analytics')) {
  trackEvent('user_action');
}

// Wrapper para funções
const trackWithConsent = withConsentGate(trackEvent, 'analytics');
trackWithConsent('user_action'); // Só executa se consentido
```

### Middleware
```typescript
import { analyticsAllowed } from '@/middleware/consent';

async function trackAnalytics() {
  if (await analyticsAllowed()) {
    // Tracking permitido
  }
}
```

## 🧪 Testes

### Executar Testes
```bash
# Testes unitários
npm test src/tests/consent.test.tsx

# Testes de integração
npm run test:integration

# Build para verificar SSR
npm run build
```

### Cobertura de Testes
- ✅ SSR safety
- ✅ Storage operations
- ✅ Version management
- ✅ Expiration handling
- ✅ Google Consent Mode
- ✅ Component rendering
- ✅ Hook behavior

## 🔄 Atualizando a Política

### 1. Alterar Versão
```typescript
// src/lib/consent.ts
export const CONSENT_VERSION = "1.1.0"; // Incrementar versão
```

### 2. Atualizar Textos
```typescript
// src/components/privacy/ConsentDialog.tsx
<DialogTitle>Novo título da política</DialogTitle>
<DialogDescription>Nova descrição...</DialogDescription>
```

### 3. Testar
```bash
npm test
npm run build
```

## 🎯 Conformidade LGPD

### ✅ Princípios Implementados
- **Transparência**: Textos claros sobre uso de dados
- **Finalidade**: Categorias específicas com propósitos definidos
- **Necessidade**: Apenas dados necessários para cada categoria
- **Livre acesso**: Usuário pode alterar preferências a qualquer momento
- **Qualidade**: Dados precisos e atualizados
- **Segurança**: Proteção contra acesso não autorizado

### ✅ Direitos do Titular
- **Acesso**: Usuário pode ver suas preferências
- **Retificação**: Pode alterar consentimento
- **Exclusão**: Pode revogar consentimento
- **Portabilidade**: Dados podem ser exportados
- **Oposição**: Pode se opor ao tratamento

## 🚀 Deploy e Monitoramento

### Variáveis de Ambiente
```env
# Sentry (opcional)
VITE_SENTRY_DSN=your_sentry_dsn

# Google Analytics (opcional)
VITE_GA_MEASUREMENT_ID=your_ga_id
```

### Monitoramento
- Eventos de consentimento no dataLayer
- Logs de consentimento no Sentry
- Métricas de aceitação/rejeição

### Lighthouse
- Categoria A11y: Verificar acessibilidade do banner
- Categoria Best Practices: Verificar conformidade LGPD

## 🔍 Debugging

### Verificar Estado do Consentimento
```typescript
import { getConsentSummary } from '@/lib/consent-gates';

console.log(getConsentSummary());
// {
//   essential: true,
//   analytics: true,
//   marketing: false,
//   version: "1.0.0",
//   timestamp: "2024-01-01T00:00:00.000Z",
//   age: 30
// }
```

### Limpar Consentimento (Desenvolvimento)
```typescript
import { clearConsent } from '@/lib/consent';

clearConsent(); // Remove todos os dados de consentimento
```

## 📚 Referências

- [LGPD - Lei Geral de Proteção de Dados](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [Google Consent Mode v2](https://developers.google.com/tag-platform/security/guides/consent)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [Cookie Consent Best Practices](https://www.cookiepro.com/knowledge/what-is-cookie-consent/)
