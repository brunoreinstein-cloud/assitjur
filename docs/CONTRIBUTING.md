# 🤝 Guia de Contribuição — Assistjur.IA

Obrigado por querer contribuir com o **Assistjur.IA**!  
Este documento descreve como colaborar de forma organizada e segura.

---

## 🚀 Como Contribuir
1. **Fork** do repositório.  
2. Crie uma branch:
   ```bash
   git checkout -b feature/nome-da-feature

Faça os commits seguindo boas práticas:

Mensagens curtas e descritivas

Ex: feat: adicionar exportação em PDF

Abra um Pull Request para a branch main.

Aguarde revisão dos mantenedores.
🧪 Boas Práticas de Código

Use TypeScript sempre que possível.

Rode lint antes de abrir PR:

npm run lint


Escreva testes unitários para novas funções.

Documente mudanças relevantes no README ou nos docs/.

📦 Commits Semânticos

feat: → nova funcionalidade

fix: → correção de bug

docs: → documentação

chore: → manutenção sem impacto funcional

test: → testes

🔒 Segurança e LGPD

Nunca commitar dados pessoais reais.

Não versionar .env ou chaves privadas.

Reportar vulnerabilidades em security@assistjur.ia
.


---

## 🔒 `SECURITY.md`
```markdown
# 🔒 Política de Segurança — Assistjur.IA

A segurança dos dados e a conformidade com a LGPD são prioridades do Assistjur.IA.  

---

## 📢 Reportar Vulnerabilidades
Se encontrar vulnerabilidade:
1. Não abra issue pública.  
2. Envie detalhes para **security@assistjur.ia**.  
3. Inclua:
   - Descrição do problema  
   - Passos para reproduzir  
   - Impacto potencial  

---

## ✅ Práticas de Segurança
- Uso de **Row Level Security (RLS)** em todas as tabelas sensíveis.  
- Logs de auditoria em exportações e acessos.  
- Variáveis sensíveis em `.env` (não versionadas).  
- Sanitização de entradas contra XSS e injeções.  
- Políticas de retenção de dados aplicadas por organização.  

---

## ⚖️ Conformidade
- Alinhado à **LGPD** (Brasil).  
- Preparação para aderência à **ISO/IEC 42001** (Governança de IA).  
- Rotinas de auditoria contínua.