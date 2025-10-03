# 📘 Guia de Uso — Assistjur.IA

Este guia apresenta como utilizar o **Assistjur.IA**, desde o acesso inicial até as funcionalidades avançadas de análise de processos e testemunhas.

---

## 🚀 Introdução

O **Assistjur.IA** foi desenvolvido para auxiliar escritórios e departamentos jurídicos na **gestão estratégica de processos**, com foco em:

- Inteligência de Testemunhas
- Análise de Processos CNJ
- Governança e Compliance em IA

---

## 🔑 Acesso e Autenticação

1. Acesse o sistema pelo link: `https://app.assistjur.ia`
2. Métodos de login disponíveis:
   - **E-mail e senha** (formulário clássico).
   - **Magic Link** (link enviado por e-mail).
   - **OAuth** (Google / Microsoft, se ativado pela organização).
   - **2FA** (opcional, conforme configuração da sua organização).

Se você não tiver acesso, entre em contato com o administrador da sua organização.

---

## 📂 Estrutura de Dados

### Importação

- Você pode importar arquivos CSV com dados de processos e testemunhas.
- Exemplos disponíveis em `/public/template-base-exemplo.csv`.
- Após upload, os dados passam por **validação automática** (normalização de CNJ, nomes e duplicidades).

### Versionamento

- Cada importação cria uma **nova versão de base**.
- Estados possíveis: `Draft`, `Published`, `Archived`.
- Apenas **admins** podem publicar versões.

---

## 🔍 Funcionalidades Principais

### 1. **Mapa de Testemunhas**

- Identifica triangulações, trocas diretas e provas emprestadas.
- Apresenta classificação de risco: **Baixo, Médio, Alto, Crítico**.
- Exibe **insights estratégicos** para cada testemunha.

### 2. **Análise de Processos**

- Filtros por **UF, Comarca, Fase, Classificação de Risco**.
- Máscara de dados pessoais (LGPD) pode ser ativada/desativada.
- Exportação em **PDF, CSV e JSON** via painel de exportação.

### 3. **Dashboard Administrativo**

- Gestão de organizações, usuários e permissões.
- Painel de auditoria com logs de acesso e exportações.
- Definição de políticas de retenção de dados.

### 4. **Integração com IA**

- Prompts configuráveis para análise contextual de processos.
- Playground interno para testar diferentes modelos da OpenAI.
- Governança: logs de tokens e custos por organização.

---

## 🧪 Testes de Qualidade

Antes de liberar uma versão:

- Utilize o **Edge Function Tester** para validar conectividade.
- Execute testes de importação com os arquivos `template-test-exemplo.csv`.
- Verifique se os alertas LGPD e logs estão funcionando.

---

## 📜 Boas Práticas

- Sempre use arquivos limpos e normalizados (CNJ válido).
- Revise permissões de usuários regularmente.
- Ative 2FA para maior segurança.
- Em caso de incidente, consulte o **Playbook de Resposta a Incidentes** (em construção).

---

## 📞 Suporte

- Documentação técnica: `docs/`
- Contato interno: equipe Assistjur
- Incidentes críticos: `security@assistjur.ia`
