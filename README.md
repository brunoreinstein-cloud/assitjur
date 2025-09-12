# ⚖️ Assistjur.IA

[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg?logo=renovatebot)](https://renovatebot.com/)

**Assistjur.IA** é uma plataforma SaaS voltada para escritórios e departamentos jurídicos, especializada em:

- **Inteligência de Testemunhas** (mapa de triangulação, prova emprestada, risco de contradita).
- **Análise de Processos CNJ** com Supabase e Edge Functions.
- **Compliance e Governança de IA** alinhados à LGPD e ISO/IEC 42001.

---

## 🚀 Tecnologias Principais

- **Frontend:** Vite + React + TypeScript + Tailwind + shadcn/ui
- **Backend:** Supabase (Postgres + RLS + Functions em Deno)
- **Automação:** n8n, Edge Functions e integrações externas
- **Testes:** Vitest + Testing Library
- **Segurança:** RLS, sanitização de entrada, rate limiting

---

## 📚 Documentação

- [Configuração de CORS](docs/cors-setup.md)

---

## 📦 Como Rodar o Projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-org/assistjur.git
cd assistjur
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Como configurar ENV local

Copie o arquivo de exemplo e preencha com seus valores locais:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` gerado. Exemplo de conteúdo:

```bash
VITE_SUPABASE_URL="https://xxxx.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="chave-publica"
VITE_PUBLIC_SITE_URL="http://localhost:5173"
VITE_SENTRY_DSN=""
VITE_INACTIVITY_TIMEOUT_MINUTES="30"
VITE_FEATURE_FLAGS_REFRESH_INTERVAL="60000"
VITE_FEATURE_FLAGS_CACHE_TTL="300000"
VITE_MAINTENANCE="false"
VITE_ALLOWED_ORIGINS="http://localhost:5173"
VITE_EXTRA_ORIGINS=""
VITE_PREVIEW_TIMESTAMP=""

SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_PUBLISHABLE_KEY="public-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="service-role-key"
SUPABASE_TEST_URL="https://xxxx.supabase.co"
SUPABASE_TEST_KEY="chave-publica"
PLAYWRIGHT_BASE_URL="http://localhost:5173"
JWT_SECRET="sup3r-s3cret"
RATE_LIMIT_MAX="20"
RATE_LIMIT_WINDOW_MS="60000"
```

Os valores `https://xxxx.supabase.co`, `chave-publica` e demais exemplos acima são placeholders.
Substitua-os pelos dados reais do seu projeto Supabase ao rodar o app localmente ou em produção.

Nunca exponha chaves privadas no repositório. Use `.env.example` apenas como referência.

#### Variáveis no CI

As mesmas variáveis `VITE_*` precisam estar definidas no ambiente de CI.
No GitHub Actions, adicione-as como **Secrets** do repositório para
evitar falhas silenciosas durante o `npm run build`:

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_PUBLIC_SITE_URL
VITE_SENTRY_DSN
VITE_INACTIVITY_TIMEOUT_MINUTES
VITE_FEATURE_FLAGS_REFRESH_INTERVAL
VITE_FEATURE_FLAGS_CACHE_TTL
VITE_MAINTENANCE
VITE_ALLOWED_ORIGINS
VITE_EXTRA_ORIGINS
VITE_PREVIEW_TIMESTAMP
```

Se os secrets `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` não forem definidos,
o workflow de CI usará os placeholders `https://placeholder.supabase.co` e `placeholder-key`.
Use esses valores apenas para builds de exemplo; configure os secrets com os valores reais
do seu projeto Supabase para builds que acessam um backend de verdade.

Outras variáveis `VITE_*` usadas pelo projeto podem ser adicionadas conforme necessário.

### Como configurar ENV no Lovable

No [Lovable](https://lovable.so), acesse **Settings → Environment Variables** e
defina as mesmas variáveis `VITE_*` usadas localmente (por exemplo,
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_PUBLIC_SITE_URL`).
Use exatamente os mesmos nomes com o prefixo `VITE_` para que o build funcione
corretamente.

### CORS nas Edge Functions

Defina o segredo `ALLOWED_ORIGINS` no projeto Supabase para controlar quais origens podem chamar as Edge Functions:

```
ALLOWED_ORIGINS="https://assistjur.com.br,https://*.lovable.dev"
```

Uso no handler:

```ts
import {
  parseAllowedOrigins,
  corsHeaders,
  handlePreflight,
} from "../_shared/cors.ts";

const origins = parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS"));

Deno.serve(async (req) => {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const ch = corsHeaders(req, origins);
  const pf = handlePreflight(req, origins, { "x-request-id": requestId });
  if (pf) return pf;
  //...
});
```

### 4. Rodar em modo dev

```bash
npm run dev
```

### 5. Rodar migrações no Supabase

```bash
supabase migration up
```

### 6. Testar Edge Functions

```bash
supabase functions invoke chat-legal --no-verify-jwt --local
```

### Como testar Edge Function

Use o script `scripts/smoke-edge.sh` para fazer um teste rápido da Edge Function:

```bash
FUNCTION_URL="https://example.supabase.co/functions/v1/chat-legal" \
SUPABASE_PUBLISHABLE_KEY="chave-publica" \
JWT="token-jwt" \
scripts/smoke-edge.sh
```

O script envia `{"page":1,"limit":1}` e falha se a resposta não for **200**.

### Exemplos de curl

#### mapa-testemunhas-processos

```bash
curl -X POST "$SUPABASE_URL/functions/v1/mapa-testemunhas-processos" \
 -H "Authorization: Bearer $JWT" \
 -H "Content-Type: application/json" \
 -d '{"paginacao":{"page":1,"limit":10},"filtros":{"search":"joao"}}'
```

#### mapa-testemunhas-testemunhas

```bash
curl -X POST "$SUPABASE_URL/functions/v1/mapa-testemunhas-testemunhas" \
 -H "Authorization: Bearer $JWT" \
 -H "Content-Type: application/json" \
 -d '{"paginacao":{"page":1,"limit":10},"filtros":{"nome":"Maria"}}'
```

---

## 📂 Estrutura de Pastas

```
├── app/api/ # Rotas de API
├── src/ # Código principal
│ ├── components/ # Componentes React
│ ├── hooks/ # Hooks customizados
│ ├── lib/ # Segurança, utils, supabase
│ ├── pages/ # Páginas do app
│ ├── tests/ # Testes automatizados
├── supabase/ # Migrações e functions
├── public/ # Assets e CSVs de exemplo
└── docs/ # Guias e documentação
```

---

## 🧪 Testes

```bash
npm run test
```

---

## 🌐 Auditoria de Site

O repositório inclui um **Auditor Web** para inspecionar páginas externas com Playwright, axe-core e Lighthouse.

### Instalação das dependências do navegador

```bash
npx playwright install
```

### Executar auditoria completa

```bash
npm run audit -- --url=https://assistjur.com.br/
```

Os artefatos serão gerados em `out/` (`audit.json`, `audit.md`, `snapshot.html` e `fixes/`).

### Executar apenas Lighthouse

```bash
npm run lh -- --url=https://assistjur.com.br/
```

---

## 🔒 Segurança

- Uso de **RLS (Row Level Security)** em todas as tabelas sensíveis.
- Sanitização de entradas no frontend.
- Logs de auditoria nas exports e Edge Functions.
- **Nunca** subir `.env` ou chaves privadas no repositório.
- Funções Supabase seguem dois padrões:
- **client-RLS** – usam o JWT do usuário final e respeitam as políticas de RLS.
- **admin-no-RLS** – executadas com `SERVICE_ROLE_KEY`, exigem autorização administrativa e ignoram RLS.

---

## 🤝 Contribuindo

1. Crie uma branch: `feature/nome-da-feature`.
2. Abra PR para `main`.
3. Siga o guia em `CONTRIBUTING.md` (em construção).

---

## 📜 Licença

Propriedade intelectual de **Assistjur.IA**.
Uso restrito a colaboradores autorizados.

