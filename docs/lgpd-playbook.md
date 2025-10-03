# Playbook Interno de LGPD

Este playbook resume como o AssistJur trata dados pessoais e responde aos direitos dos titulares conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Utilize-o como referência rápida para auditorias, treinamentos e alinhamento entre times.

## Mapa de Dados

| Feature/Processo     | Dados Coletados                                    | Origem                            | Armazenamento                 | Retenção                            | Finalidade                                             |
| -------------------- | -------------------------------------------------- | --------------------------------- | ----------------------------- | ----------------------------------- | ------------------------------------------------------ |
| Cadastro de Usuários | Nome, e-mail, senha hash, telefone                 | Formulário de cadastro            | `users` (Supabase Auth)       | Enquanto durar a relação contratual | Criar conta e autenticar acesso                        |
| Analitycs            | ID anônimo, IP truncado, eventos de uso            | Navegador via scripts de tracking | `analytics_events` (Supabase) | 13 meses                            | Mensurar uso do produto e orientar melhorias           |
| Pagamentos           | Nome, e-mail, dados do cartão tokenizados, recibos | Checkout Stripe                   | Stripe + `billing`            | 5 anos após término da relação      | Processar cobranças e cumprir obrigações fiscais       |
| Suporte ao Cliente   | E-mail, conversas, anexos                          | Formulário de suporte/Chat        | `support_tickets`             | 2 anos após resolução               | Atender solicitações e manter histórico de atendimento |
| Marketing/Newsletter | Nome, e-mail, preferências de conteúdo             | Formulário de opt-in              | `marketing_contacts`          | Até revogação do consentimento      | Enviar comunicações de marketing                       |
| Logs de Segurança    | IP, user agent, timestamp, ação realizada          | Backend e CDN                     | `security_logs`               | 6 meses                             | Detectar fraudes e garantir a segurança do sistema     |

## Bases Legais por Feature

| Feature/Processo     | Base Legal (LGPD art. 7)                   | Observações                                                            |
| -------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| Cadastro de Usuários | Execução de contrato (inciso V)            | Necessário para prestação do serviço                                   |
| Analitycs            | Consentimento (inciso I)                   | Coleta habilitada somente após aceite no banner de consentimento       |
| Pagamentos           | Execução de contrato (inciso V)            | Dados compartilhados com provedores de pagamento e autoridades fiscais |
| Suporte ao Cliente   | Legítimo interesse (inciso IX)             | Avaliação de impacto realizada; opção de anonimizar tickets sensíveis  |
| Marketing/Newsletter | Consentimento (inciso I)                   | Opt-out disponível em todos os e-mails                                 |
| Logs de Segurança    | Cumprimento de obrigação legal (inciso II) | Retenção mínima exigida para investigação de incidentes                |

## Fluxo de DSR (Direitos do Titular)

1. **Recebimento**: Solicitação chega via e-mail `privacidade@assistjur.com.br` ou formulário dedicado.
2. **Registro**: Ticket é criado em `support_tickets` com categoria "LGPD".
3. **Validação de Identidade**: Time de Suporte confirma identidade por autenticação na conta ou documento.
4. **Análise**: DPO revisa escopo do pedido e consulta tabelas impactadas.
5. **Execução**:
   - _Acesso_: exportação dos dados em formato estruturado (`JSON/CSV`).
   - _Correção_: ajustes realizados diretamente pelo usuário ou via Suporte.
   - _Exclusão/Anonimização_: disparo de script que remove ou ofusca dados nas tabelas listadas.
   - _Portabilidade_: envio dos dados ao novo controlador mediante autorização.
6. **Resposta ao Titular**: comunicado via e-mail com resultado da ação e arquivo exportado quando aplicável.
7. **Encerramento**: Ticket é fechado e registrado em `lgpd_requests_history` para auditoria.

## Prazos e Responsáveis

| Direito/Atividade                    | Prazo Máximo                  | Responsável Primário | Apoio                                |
| ------------------------------------ | ----------------------------- | -------------------- | ------------------------------------ |
| Confirmação de tratamento            | 15 dias                       | Suporte              | DPO                                  |
| Acesso aos dados                     | 15 dias (prorrogável por +15) | DPO                  | Engenharia para exportação           |
| Correção de dados                    | 20 dias                       | Suporte              | Engenharia                           |
| Anonimização/Exclusão                | 30 dias                       | Engenharia           | DPO                                  |
| Portabilidade                        | 15 dias                       | DPO                  | Engenharia / Financeiro (pagamentos) |
| Revogação de consentimento           | Imediato                      | Backend automático   | Suporte para confirmação             |
| Registro e auditoria de solicitações | Contínuo                      | DPO                  | Suporte                              |

### Contatos

- **DPO**: Maria Silva – `maria.silva@assistjur.com.br`
- **Suporte**: Equipe Support – `suporte@assistjur.com.br`
- **Engenharia**: Tech Lead – `techlead@assistjur.com.br`

Revise este playbook a cada 12 meses ou diante de alterações significativas nas operações de tratamento.
