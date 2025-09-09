# Configuração de CORS

## 1. Definir variável no Dashboard
No [Dashboard](https://supabase.com/dashboard): **Project Settings → Configuration → Secrets → NEW**

Valor:

```
ALLOWED_ORIGINS="https://assistjur.com.br,https://www.assistjur.com.br,https://assistjur.com,https://www.assistjur.com,https://*.lovable.dev"
```

## 2. Alternativa via CLI
Execute o comando abaixo substituindo `<REF>` pelo ID do projeto:

```bash
# Configura ALLOWED_ORIGINS para o ambiente de produção
supabase secrets set --project-ref <REF> --env prod ALLOWED_ORIGINS="https://assistjur.com.br,https://www.assistjur.com.br,https://assistjur.com,https://www.assistjur.com,https://*.lovable.dev"
```

## 3. Nota de segurança
Evite curingas amplos na configuração de CORS. O curinga `https://*.lovable.dev` é permitido apenas para pré-visualizações.

## 4. Redeploy das funções
Após atualizar o segredo, faça o redeploy das functions pelo Dashboard ou via CLI.
