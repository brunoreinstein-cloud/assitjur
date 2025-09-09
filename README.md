````markdown
# ⚖️ Assistjur.IA

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
````

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` (não commitado). Use o modelo abaixo:

```bash
VITE_SUPABASE_URL="https://xxxx.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="chave-publica"

SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_ANON_KEY="public-anon-key"
SUPABASE_SERVICE_ROLE_KEY="service-role-key"
JWT_SECRET="sup3r-s3cret"
RATE_LIMIT_MAX="20"
RATE_LIMIT_WINDOW_MS="60000"
```

👉 Nunca exponha chaves privadas no repositório. Use `.env.example` para documentação.

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
ANON_KEY="chave-publica" \
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
├── app/api/           # Rotas de API
├── src/               # Código principal
│   ├── components/    # Componentes React
│   ├── hooks/         # Hooks customizados
│   ├── lib/           # Segurança, utils, supabase
│   ├── pages/         # Páginas do app
│   ├── tests/         # Testes automatizados
├── supabase/          # Migrações e functions
├── public/            # Assets e CSVs de exemplo
└── docs/              # Guias e documentação
```

---

## 🧪 Testes

```bash
npm run test
```

---

## 🔒 Segurança

* Uso de **RLS (Row Level Security)** em todas as tabelas sensíveis.
* Sanitização de entradas no frontend.
* Logs de auditoria nas exports e Edge Functions.
* **Nunca** subir `.env` ou chaves privadas no repositório.
* Funções Supabase seguem dois padrões:
  * **client-RLS** – usam o JWT do usuário final e respeitam as políticas de RLS.
  * **admin-no-RLS** – executadas com `SERVICE_ROLE_KEY`, exigem autorização administrativa e ignoram RLS.

---

## 🤝 Contribuindo

1. Crie uma branch: `feature/nome-da-feature`.
2. Abra PR para `main`.
3. Siga o guia em `CONTRIBUTING.md` (em construção).

---

## 📜 Licença

Propriedade intelectual de **Assistjur.IA**.
Uso restrito a colaboradores autorizados.

```