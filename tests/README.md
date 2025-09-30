# AssistJur.IA - Test Suite

## Estrutura de Testes

### 📁 Organização
```
tests/
├── integration/           # Testes de integração com Supabase
│   ├── multi-tenant.test.ts      # Isolamento multi-tenant
│   └── rls-validation.test.ts    # Validação de RLS
├── analytics-events.test.ts      # Testes de analytics
└── integration.supabase.test.ts  # Testes gerais Supabase

src/
├── tests/
│   ├── mocks/            # Dados mockados
│   │   ├── organizations.ts
│   │   └── users.ts
│   ├── helpers/          # Utilitários de teste
│   │   └── test-utils.tsx
│   └── setup.ts          # Setup global
├── contexts/__tests__/   # Testes de contexts
│   └── MultiTenantContext.test.tsx
└── hooks/__tests__/      # Testes de hooks
    └── useMultiTenantLoading.test.tsx
```

## 🚀 Executando Testes

### Testes Unitários
```bash
npm run test              # Executa todos os testes unitários
npm run test:watch        # Modo watch
npm run test:coverage     # Com cobertura
```

### Testes de Integração
```bash
npm run test:integration  # Testes com Supabase real
```

**Requisitos para testes de integração:**
- `.env.local` configurado com:
  - `SUPABASE_TEST_URL`
  - `SUPABASE_TEST_KEY`
  - `SUPABASE_TEST_EMAIL`
  - `SUPABASE_TEST_PASSWORD`

## 📝 Tipos de Testes

### 1. **Testes Unitários**
- Testes de contexts (MultiTenantContext)
- Testes de hooks (useMultiTenantLoading)
- Testes de componentes isolados
- Utilizam mocks completos

### 2. **Testes de Integração**
- Validação de RLS policies
- Isolamento multi-tenant
- Operações CRUD com banco real
- Edge functions

### 3. **Testes de Segurança**
- Tentativas de acesso não autorizado
- Validação de data access levels
- Cross-org data access prevention
- Financial data protection

## 🔧 Utilitários de Teste

### `renderWithProviders`
Renderiza componentes com todos os providers necessários:
```typescript
import { renderWithProviders } from '@/tests/helpers/test-utils';

const { result } = renderWithProviders(<MyComponent />);
```

### `createTestQueryClient`
Cria um QueryClient configurado para testes:
```typescript
import { createTestQueryClient } from '@/tests/helpers/test-utils';

const queryClient = createTestQueryClient();
```

### Mocks
```typescript
import { mockOrganizations, mockSingleOrg } from '@/tests/mocks/organizations';
import { mockUsers, mockProfiles } from '@/tests/mocks/users';
```

## ✅ Checklist de Cobertura

### Multi-Tenant System
- [x] Inicialização do MultiTenantContext
- [x] Loading states progressivos
- [x] Troca de organizações
- [x] Cache de organizações
- [x] Error recovery
- [x] Fallback para org padrão

### RLS Security
- [x] Isolamento de dados por org_id
- [x] Profiles isolation
- [x] Processos isolation
- [x] Pessoas isolation
- [x] Audit logs admin-only access
- [x] Financial data protection
- [x] Cross-org access prevention

### Error Boundaries
- [x] OrganizationErrorBoundary
- [x] AuthErrorBoundary
- [x] Recovery mechanisms

## 🎯 Métricas de Sucesso

- **Cobertura mínima**: 80%
- **Tempo de execução**: < 10s (unitários)
- **RLS violations**: 0
- **Cross-org leaks**: 0
- **Security warnings**: 0 critical

## 📊 Comandos Úteis

```bash
# Coverage report
npm run test:coverage

# Testes específicos
npm run test -- MultiTenantContext
npm run test -- --reporter=verbose

# Debug
npm run test -- --inspect-brk

# Integração com logs
npm run test:integration -- --reporter=verbose
```

## 🔐 Segurança nos Testes

**NUNCA commite:**
- Credenciais reais no código
- Tokens de API
- Senhas de teste
- IDs de organizações reais sensíveis

**Use sempre:**
- Variáveis de ambiente
- Mocks para testes unitários
- Dados anônimos para testes de integração
- Cleanup após cada teste
