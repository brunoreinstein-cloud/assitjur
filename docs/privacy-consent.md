# Consentimento de Dados

Este módulo gerencia o banner de consentimento conforme LGPD e o Google Consent Mode v2.

## Arquitetura
- **`src/hooks/useConsent.ts`**: contexto global que carrega e persiste preferências em `localStorage` (`assistjur_consent_v1.0.0`). Aplica o estado ao `gtag` e publica eventos no `dataLayer`.
- **`src/components/privacy/ConsentDialog.tsx`**: UI em formato *bottom sheet* com ações "Aceitar tudo", "Rejeitar tudo" e "Salvar preferências". Categorias: Essenciais (fixo), Medição e Publicidade. Opcionalmente habilita "Compartilhamento" ajustando `SHARING_ENABLED`.
- **`src/lib/privacy/consent.ts`**: utilitários para ler/gravar preferências, aplicar padrões de consentimento negado por padrão e enviar atualizações ao `gtag`.

## Atualizando microcopy
Os textos exibidos no painel estão definidos em `ConsentDialog.tsx`. Ajuste-os conforme necessidade e mantenha as traduções acessíveis.

## Versionamento
Atualize `CONSENT_VERSION` em `lib/privacy/consent.ts` ao alterar a política. O banner será exibido novamente quando a versão mudar ou após 180 dias.

## Testes
1. `npm run build` – garante que o projeto compila com o banner.
2. `npm test` – executa testes unitários.
3. No navegador, validar com Lighthouse (categoria A11y) e conferir eventos `consent_update` no `dataLayer`.

## GTM / Consent Mode
Configure suas tags no Google Tag Manager para respeitar os sinais de consentimento (`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`). Nenhuma tag deve disparar antes do consentimento.
