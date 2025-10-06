# Guia de Variáveis de Ambiente para Vercel

Este documento consolida as variáveis necessárias para executar o AssistJUR em deployments da Vercel. Utilize-o como referência ao preencher os ambientes **Development**, **Preview** e **Production** no painel da plataforma.

## Variáveis expostas ao frontend (`VITE_*`)

| Variável                              | Finalidade                                                                                                                                         | Ambientes                                                                            | Exemplo de valor                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `VITE_SUPABASE_URL`                   | URL do projeto Supabase consumida pelo frontend e por rotinas de prerenderização.                                                                  | Development / Preview / Production (use o endpoint do ambiente correspondente).      | `https://xxxx.supabase.co`                      |
| `VITE_SUPABASE_ANON_KEY`              | Chave pública (anon) do Supabase para autenticação no navegador.                                                                                   | Development / Preview / Production (combine com o respectivo `VITE_SUPABASE_URL`).   | `eyJhbGciOiJI...`                               |
| `VITE_SUPABASE_PUBLISHABLE_KEY`       | Chave alternativa (publishable) para acesso público ao Supabase. Pode ser usada no lugar da anon.                                                  | Development / Preview / Production.                                                  | `eyJhbGciOiJI...`                               |
| `VITE_PUBLIC_SITE_URL`                | URL base usada pelo app para gerar links absolutos.                                                                                                | Development / Preview / Production (por exemplo localhost, preview e domínio final). | `https://app.assistjur.com`                     |
| `VITE_SENTRY_DSN`                     | DSN do Sentry para capturar erros do frontend. Opcional, mas recomendado em Preview/Production.                                                    | Preview / Production (opcional em Development).                                      | `https://key.ingest.sentry.io/12345`            |
| `VITE_INACTIVITY_TIMEOUT_MINUTES`     | Minutos até a sessão do usuário expirar por inatividade.                                                                                           | Development / Preview / Production.                                                  | `30`                                            |
| `VITE_FEATURE_FLAGS_REFRESH_INTERVAL` | Intervalo (ms) para atualizar feature flags no cliente.                                                                                            | Development / Preview / Production.                                                  | `60000`                                         |
| `VITE_FEATURE_FLAGS_CACHE_TTL`        | Tempo (ms) de cache de feature flags no cliente.                                                                                                   | Development / Preview / Production.                                                  | `300000`                                        |
| `VITE_MAINTENANCE`                    | Ativa modo manutenção no frontend (`true`/`false`).                                                                                                | Preview / Production (opcional em Development).                                      | `false`                                         |
| `VITE_ALLOWED_ORIGINS`                | Lista de origens permitidas para chamadas (separadas por vírgula) usada por integrações.                                                           | Development / Preview / Production.                                                  | `http://localhost:5173,https://*.assistjur.com` |
| `VITE_EXTRA_ORIGINS`                  | Origens adicionais liberadas dinamicamente.                                                                                                        | Development / Preview / Production.                                                  | `https://sandbox.assistjur.com`                 |
| `VITE_PREVIEW_TIMESTAMP`              | Marca temporal para identificar builds de preview.                                                                                                 | Preview.                                                                             | `2024-06-01T12:00:00Z`                          |
| `VITE_OPENAI_API_KEY`                 | Chave pública usada pelo frontend quando uma funcionalidade exige acesso direto à API da OpenAI. Prefira usar funções server-side quando possível. | Development / Preview / Production (somente se o recurso estiver habilitado).        | `sk-demo123`                                    |
| `VITE_OPENAI_ORG`                     | Identificador da organização na OpenAI para requisições feitas pelo frontend.                                                                      | Development / Preview / Production (caso aplicável).                                 | `org-abc123`                                    |
| `VITE_OPENAI_PROJECT`                 | Projeto da OpenAI associado às chamadas originadas no frontend.                                                                                    | Development / Preview / Production (caso aplicável).                                 | `proj-assistjur`                                |

## Variáveis usadas em rotinas server-side ou funções

Estas variáveis podem ser necessárias para scripts de build, prerenderização e integrações server-side que também são executados no ambiente da Vercel.

| Variável                    | Finalidade                                                                                            | Ambientes                                                          | Exemplo de valor                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| `SUPABASE_URL`              | URL do Supabase acessada por scripts Node (ex.: prerender). Usa o mesmo valor de `VITE_SUPABASE_URL`. | Development / Preview / Production.                                | `https://xxxx.supabase.co`                            |
| `SUPABASE_PUBLISHABLE_KEY`  | Chave pública do Supabase usada por scripts server-side.                                              | Development / Preview / Production.                                | `eyJhbGciOiJI...`                                     |
| `SUPABASE_ANON_KEY`         | Chave anon equivalente usada por funções server-side.                                                 | Development / Preview / Production.                                | `eyJhbGciOiJI...`                                     |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role utilizada por scripts administrativos (não deve ir para o frontend).               | Preview / Production (somente quando necessário).                  | `service-role-key`                                    |
| `SENTRY_DSN`                | DSN do Sentry para capturar erros em funções/rotinas Node.                                            | Preview / Production.                                              | `https://key.ingest.sentry.io/12345`                  |
| `OPENAI_API_KEY`            | Chave da OpenAI usada em chamadas server-side (preferencial ao uso das variáveis `VITE_*`).           | Preview / Production (defina também em Development se for testar). | `sk-live123`                                          |
| `OPENAI_ORG`                | Organização da OpenAI usada em chamadas server-side.                                                  | Conforme necessidade em cada ambiente.                             | `org-abc123`                                          |
| `OPENAI_PROJECT`            | Projeto da OpenAI associado às chamadas server-side.                                                  | Conforme necessidade em cada ambiente.                             | `proj-assistjur`                                      |
| `OPENAI_DEFAULT_MODEL`      | Modelo padrão utilizado pelas funções de chat.                                                        | Preview / Production (ou conforme testes em Development).          | `gpt-4o-mini`                                         |
| `OPENAI_TEMPERATURE`        | Temperatura padrão das respostas da OpenAI (número).                                                  | Development / Preview / Production.                                | `0.2`                                                 |
| `OPENAI_MAX_MSG_LEN`        | Comprimento máximo (caracteres) das mensagens enviadas à OpenAI.                                      | Development / Preview / Production.                                | `2000`                                                |
| `OPENAI_MAX_TOKENS`         | Limite de tokens para respostas da OpenAI.                                                            | Development / Preview / Production.                                | `1500`                                                |
| `OPENAI_TIMEOUT_MS`         | Timeout (ms) para requisições à OpenAI no servidor.                                                   | Development / Preview / Production.                                | `30000`                                               |
| `ALLOWED_ORIGINS`           | Lista de origens autorizadas para funções edge/serverless.                                            | Development / Preview / Production.                                | `http://localhost:5173,https://preview.assistjur.com` |
| `FLAG_RATE_LIMIT`           | Quantidade máxima de avaliações de feature flags por minuto em funções específicas.                   | Development / Preview / Production.                                | `60`                                                  |
| `RATE_LIMIT_MAX`            | Número máximo de requisições aceitas no intervalo configurado.                                        | Development / Preview / Production.                                | `20`                                                  |
| `RATE_LIMIT_WINDOW_MS`      | Janela de tempo (ms) usada pelo rate limiting.                                                        | Development / Preview / Production.                                | `60000`                                               |
| `JWT_SECRET`                | Segredo usado para assinar e validar JWTs em rotinas server-side.                                     | Preview / Production (opcional para testes em Development).        | `sup3r-s3cret`                                        |
| `SMTP_HOST`                 | Servidor SMTP para envios de e-mail.                                                                  | Preview / Production (caso o recurso esteja ativo).                | `smtp.example.com`                                    |
| `SMTP_PORT`                 | Porta do servidor SMTP.                                                                               | Preview / Production.                                              | `587`                                                 |
| `SMTP_USER`                 | Usuário/autenticação SMTP.                                                                            | Preview / Production.                                              | `apikey`                                              |
| `SMTP_PASS`                 | Senha ou token de autenticação SMTP.                                                                  | Preview / Production.                                              | `super-secret-token`                                  |

> ⚠️ **Segurança:** marque as variáveis sensíveis como "Encrypted" na Vercel. Nunca exponha chaves privadas em valores `VITE_*`.

## Variáveis exclusivas de testes e CI

Estas variáveis servem para execuções locais ou pipelines de testes automatizados. Não é necessário cadastrá-las na Vercel, a menos que haja testes de ponta a ponta sendo executados nos deploys Preview.

| Variável              | Finalidade                                                                                                                   | Ambientes   | Exemplo de valor                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------- |
| `SUPABASE_TEST_URL`   | Endpoint do banco Supabase dedicado aos testes automatizados.                                                                | Local / CI. | `https://test-project.supabase.co` |
| `SUPABASE_TEST_KEY`   | Chave pública do projeto de testes do Supabase.                                                                              | Local / CI. | `test-publishable-key`             |
| `PLAYWRIGHT_BASE_URL` | URL base usada pelos testes de interface (Playwright).                                                                       | Local / CI. | `http://localhost:5173`            |
| `NODE_ENV`            | Define o modo de execução (`development`, `production` etc.). A Vercel ajusta automaticamente, mas pode ser útil localmente. | Local.      | `development`                      |

## Configurando os ambientes na Vercel

1. Abra o projeto no dashboard da Vercel e acesse **Settings → Environment Variables**.
2. Para cada variável listada acima, clique em **Add** e informe o nome, valor e os ambientes:
   - **Development**: usado pelo `vercel dev` e ao sincronizar variáveis localmente (`vercel env pull`). Ideal para apontar para sandboxes.
   - **Preview**: aplicado em deploys de branches. Utilize chaves de teste ou staging.
   - **Production**: usado no domínio principal (`main`/`production`). Preencha com os segredos definitivos.
3. Após salvar, rode `vercel env pull .env.local` para atualizar seus arquivos locais com os valores de Development quando necessário.
4. Sempre que um valor mudar, reexecute os deploys afetados (Preview/Production) para garantir que a nova configuração seja aplicada.
5. Valide o build executando `pnpm build` ou o pipeline padrão antes de publicar, garantindo que nenhuma variável obrigatória esteja faltando.

## Boas práticas adicionais

- Centralize os valores sensíveis fora do repositório e conceda acesso apenas a pessoas autorizadas.
- Revise periodicamente as variáveis configuradas em Preview/Production para evitar resíduos de testes.
- Mantenha o arquivo `.env.example` atualizado como referência para novos membros da equipe.
- Documente mudanças relevantes no changelog do projeto para rastreabilidade.
