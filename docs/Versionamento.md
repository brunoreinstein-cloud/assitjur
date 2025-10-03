# Sistema de Versionamento AssistJur.IA

## Visão Geral

O sistema de versionamento permite controle total sobre as versões da base de dados, com estados bem definidos e funcionalidade de rollback seguro.

## Estados das Versões

### 🔄 Draft

- **Status**: `draft`
- **Descrição**: Versão em desenvolvimento, permite múltiplas importações
- **Ações**: Importar dados, validar, publicar
- **Visibilidade**: Apenas admins

### ✅ Published

- **Status**: `published`
- **Descrição**: Versão ativa em produção
- **Ações**: Fazer rollback (arquivar)
- **Visibilidade**: Todos os usuários via views `*_live`

### 📦 Archived

- **Status**: `archived`
- **Descrição**: Versões anteriores, disponíveis para rollback
- **Ações**: Rollback (reativar como published)
- **Visibilidade**: Admins para rollback

## Edge Functions

### `create-version`

**Entrada**: `{ orgId? }`
**Saída**: `{ versionId, number }`

- Cria nova versão draft
- Incrementa automaticamente o número da versão
- Apenas admins podem criar versões

### `import-into-version`

**Entrada**: `{ versionId, processos[], fileChecksum? }`
**Saída**: `{ summary: { imported, errors, warnings } }`

- Importa dados para versão draft (idempotente)
- Valida e normaliza dados antes da inserção
- Atualiza summary da versão

### `publish-version`

**Entrada**: `{ versionId }`
**Saída**: `{ number, publishedAt }`

- Publica versão draft
- Arquiva versões anteriores automaticamente
- Define timestamp de publicação

### `rollback-version`

**Entrada**: `{ toVersionId }`
**Saída**: `{ fromVersion, toVersion, rolledBackAt }`

- Faz rollback para versão arquivada
- Arquiva versão atual
- Reativa versão target como published

### `get-last-update`

**Entrada**: Organização do usuário autenticado
**Saída**: `{ versionNumber, publishedAtUTC, summary }`

- Retorna metadata da última versão publicada
- Usado para exibir status no dashboard

## Fluxo de Versionamento

### 1. Importação Nova

```
1. POST create-version → { versionId: "v1", number: 1 }
2. Upload arquivo via wizard
3. POST import-into-version → Dados importados em draft
4. Validação e correções
5. POST publish-version → v1 ativa
```

### 2. Rollback

```
1. Identificar versão target (archived)
2. POST rollback-version → { toVersionId: "v1" }
3. v2 (current) → archived
4. v1 (target) → published
```

## Timestamps

### Servidor (UTC)

- `created_at`: Quando a versão foi criada
- `published_at`: Quando foi publicada
- Todas as funções edge trabalham com UTC

### Cliente (pt-BR)

- `useLastUpdate()`: Converte UTC para timezone local
- `formatLocalDateTime()`: dd/MM/yyyy HH:mm (BRT/BRST)
- `formatShortDateTime()`: dd/MM HH:mm

## Componentes React

### `useLastUpdate()`

Hook para buscar e formatar última atualização:

```tsx
const { versionNumber, publishedAtUTC, formatLocalDateTime } = useLastUpdate();
```

### `<LastUpdateBadge />`

Componente para exibir última atualização:

```tsx
<LastUpdateBadge />
// Saída: "Última atualização: 27/08/2025 14:32 — v3"
```

### `useImportStore` (Atualizado)

Store Zustand com suporte a versionamento:

```tsx
const {
  currentVersionId,
  versionNumber,
  createNewVersion,
  publishCurrentVersion,
} = useImportStore();
```

## Views e Dados Live

### `processos_live`

```sql
SELECT p.* FROM processos p
JOIN versions v ON v.id = p.version_id
WHERE v.status = 'published' AND v.org_id = p.org_id;
```

- Contém apenas dados da versão publicada
- Atualizada automaticamente durante publish/rollback
- RLS aplicado normalmente

## Segurança e Permissões

### RLS Policies

```sql
-- Versões visíveis por organização
CREATE POLICY "Users can view org versions" ON versions
FOR SELECT USING (auth.uid() in org);

-- Apenas admins gerenciam versões
CREATE POLICY "Only admins can manage versions" ON versions
FOR ALL USING (user_role = 'ADMIN');
```

### Validações

- Apenas drafts podem receber importações
- Apenas drafts podem ser publicados
- Apenas archived podem ser target de rollback
- File checksum para integridade

## Auditoria e Telemetria

### Eventos Registrados

- `version_created`: Nova versão draft criada
- `import_completed`: Dados importados com sucesso
- `version_published`: Versão ativada
- `rollback_executed`: Rollback realizado

### Metadata no Summary

```json
{
  "imported": 1500,
  "errors": 0,
  "warnings": 5,
  "file_checksum": "abc123...",
  "created_by": "admin@demo.com",
  "published_at": "2025-08-27T17:32:00Z",
  "total_records": 1500
}
```

## Casos de Uso

### Cenário 1: Nova Importação

1. Admin acessa `/admin/base-import`
2. Sistema cria automaticamente v4 (draft)
3. Upload e validação de arquivo
4. Revisão na prévia: "v4 (draft)"
5. Publicação: v4 → published, v3 → archived

### Cenário 2: Problema na Versão Atual

1. Admin acessa `/admin/versoes`
2. Identifica problema na v4 (ativa)
3. Rollback para v3: v4 → archived, v3 → published
4. Dashboard atualiza: "Última atualização... — v3"

### Cenário 3: Comparação de Versões

1. Admin visualiza histórico completo
2. Compara contadores: v3 (1450 registros) vs v4 (1500)
3. Análise de diferenças e decisão informada

## Limitações e Considerações

### Performance

- Índices em `(org_id, version_id)` para queries eficientes
- Views materializadas se necessário para grandes volumes

### Armazenamento

- Versões antigas ocupam espaço (considerar cleanup automático)
- Soft delete vs hard delete após X meses

### Concorrência

- Apenas uma versão published por org (constraint único)
- Lock automático durante publish/rollback

## Monitoramento

### Métricas Importantes

- Tempo médio de importação
- Taxa de sucesso de publicações
- Frequência de rollbacks
- Tamanho das versões

### Alertas

- Falha na publicação de versão
- Rollback executado (pode indicar problema)
- Versão draft antiga (>7 dias)

## Roadmap

### Próximas Funcionalidades

- [ ] Comparação visual entre versões
- [ ] Agendamento de publicações
- [ ] Backup automático antes de rollback
- [ ] Cleanup automático de versões antigas
- [ ] Notificações para mudanças de versão
