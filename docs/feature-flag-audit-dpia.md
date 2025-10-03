# Feature Flag Audit DPIA

## Dados coletados

- **user_id**: identifica quem executou a ação
- **flag_id** e detalhes da alteração (old_value/new_value)
- **timestamp** da operação

## Retenção

- Registros mantidos por padrão por **6 meses (180 dias)**.
- Prazo configurável por tenant via política de retenção (`retention_policies`).

## Finalidade

- Rastrear mudanças em feature flags para auditoria e segurança.

## Apagamento sob solicitação

- Administradores podem ajustar a política de retenção ou executar o job de limpeza (`execute_retention_cleanup`) para remover registros.
- Solicitações de titulares podem ser tratadas via suporte, que executará o mesmo mecanismo de remoção.
