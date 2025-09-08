# Variáveis de Ambiente das Edge Functions

As Edge Functions utilizam variáveis configuradas via `Deno.env`. A tabela abaixo resume as variáveis necessárias:

| Variável | Descrição |
| --- | --- |
| `ENVIRONMENT` | Define o ambiente de execução (`production`, `staging` ou `development`). |
| `ALLOWED_ORIGINS` | Lista de origens permitidas para CORS, separadas por vírgula. |
| `SUPABASE_URL` | URL do projeto Supabase. |
| `SUPABASE_ANON_KEY` | Chave pública do Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase. |

## Como configurar no Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com) e selecione o projeto desejado.
2. Vá em **Project Settings → API** para copiar os valores de `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
3. Ainda nas configurações do projeto, abra **Edge Functions → Secrets**.
4. Adicione cada variável da tabela acima utilizando os valores copiados. Para `ALLOWED_ORIGINS`, use:
   ```
   https://app.assistjur.ia,https://staging.assistjur.ia
   ```
5. Defina `ENVIRONMENT` como `production`, `staging` ou `development` conforme o ambiente desejado.
6. Salve as configurações e reimplante as Edge Functions, se necessário.

Os logs das funções utilizam `secureLog`, garantindo que nenhum segredo seja exposto nos registros.
