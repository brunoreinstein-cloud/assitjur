# Mapeamento do tenant_id no JWT

Para reforçar o isolamento por tenant, o JWT de autenticação inclui a claim `tenant_id`.
As políticas de RLS utilizam `auth.jwt() ->> 'tenant_id'` para filtrar linhas das tabelas sensíveis.

```sql
-- Exemplo de uso em políticas RLS
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
```

Garanta que o serviço de autenticação preencha `tenant_id` corretamente ao gerar o token.
