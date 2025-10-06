# 🐶 Configuração do Husky + Lint-Staged

## 📋 O que foi configurado

### **Husky**
Git hooks automatizados para garantir qualidade de código.

**Hooks instalados:**
1. **pre-commit**: Executa lint-staged antes de cada commit
2. **pre-push**: Executa type checking antes de cada push

### **Lint-Staged**
Executa linters apenas nos arquivos staged (prestes a serem commitados).

**Regras configuradas:**
- `*.{ts,tsx}`: ESLint + Prettier
- `*.{json,md,yml,yaml}`: Prettier

### **Validação de Env**
Script de validação de variáveis de ambiente obrigatórias.

**Variáveis obrigatórias:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🚀 Instalação

### **1. Instalar dependências**
```bash
npm install
```

### **2. Inicializar Husky**
```bash
npx husky install
npm pkg set scripts.prepare="husky install"
```

### **3. Criar arquivo .env**
```bash
cp .env.example .env
```

Edite `.env` e preencha com seus valores reais:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### **4. Testar validação de env**
```bash
npm run validate:env
```

### **5. Testar hooks**
```bash
# Teste o pre-commit
git add .
git commit -m "test: husky setup"

# Teste o pre-push
git push
```

---

## 📝 Scripts Disponíveis

### **Desenvolvimento**
```bash
npm run dev                # Inicia dev server
npm run build              # Build de produção
npm run preview            # Preview do build
```

### **Qualidade de Código**
```bash
npm run lint               # ESLint check
npm run lint:fix           # ESLint fix
npm run format             # Prettier format
npm run format:check       # Prettier check
npm run typecheck          # TypeScript check
```

### **Validação**
```bash
npm run validate:env       # Valida variáveis de ambiente
npm run validate           # Valida tudo (lint + type + env)
```

### **CI/CD**
```bash
npm run ci                 # Pipeline completa
```

---

## 🔧 Configurações

### **.husky/pre-commit**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### **.husky/pre-push**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run typecheck
```

### **.lintstagedrc.json**
```json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,yml,yaml}": [
    "prettier --write"
  ]
}
```

### **.eslintrc.json**
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

---

## 🐛 Troubleshooting

### **Problema: Hooks não executam**

**Causa:** Husky não foi inicializado.

**Solução:**
```bash
npx husky install
chmod +x .husky/*
```

### **Problema: Build falha por variáveis faltando**

**Causa:** Arquivo `.env` não existe ou está incompleto.

**Solução:**
```bash
# 1. Copie o exemplo
cp .env.example .env

# 2. Preencha os valores
# 3. Valide
npm run validate:env
```

### **Problema: ESLint warnings em arquivos antigos**

**Solução:**
```bash
# Fix automático
npm run lint:fix

# Ou ignore com comentário explicativo
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- legado
const data: any = oldFunction();
```

### **Problema: TypeScript errors no pre-push**

**Causa:** Código com erros de tipo.

**Solução:**
```bash
# Verifique erros
npm run typecheck

# Corrija os erros mostrados
# Ou use @ts-expect-error com comentário
// @ts-expect-error: TODO: Fix type mismatch
const result = unsafeOperation();
```

### **Problema: Commit muito lento**

**Causa:** Lint-staged processando muitos arquivos.

**Solução:**
```bash
# Commit apenas arquivos específicos
git add src/components/specific-file.tsx
git commit -m "fix: specific change"

# Ou desabilite temporariamente
HUSKY=0 git commit -m "feat: large refactor"
```

---

## 🔒 Bypass (Emergências)

### **Bypass pre-commit**
```bash
git commit --no-verify -m "emergency: fix critical bug"
```

### **Bypass pre-push**
```bash
git push --no-verify
```

### **Bypass env validation**
```bash
SKIP_ENV_VALIDATION=1 npm run build
```

**⚠️ Atenção:** Use bypass apenas em emergências. Sempre corrija os problemas depois!

---

## 📊 Fluxo de Trabalho

### **Desenvolvimento Normal**
```bash
# 1. Desenvolver
code src/components/MyComponent.tsx

# 2. Testar localmente
npm run dev

# 3. Commit (lint automático)
git add .
git commit -m "feat: add new component"

# 4. Push (type check automático)
git push
```

### **CI/CD Pipeline**
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run validate:env
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
```

---

## 📚 Boas Práticas

### ✅ **DO:**
1. Sempre crie `.env` a partir de `.env.example`
2. Execute `npm run validate` antes de fazer PR
3. Corrija warnings de lint/type progressivamente
4. Use `_` prefix para variáveis não usadas intencionalmente
5. Documente bypasses de hooks com issues/tickets

### ❌ **DON'T:**
1. Não commite o arquivo `.env` (já está no .gitignore)
2. Não use `--no-verify` sem motivo válido
3. Não ignore todos os warnings com `eslint-disable`
4. Não desabilite hooks permanentemente
5. Não commite código com erros de tipo

---

## 🎯 Checklist de Setup

Para novos desenvolvedores:

- [ ] Instalar dependências: `npm install`
- [ ] Inicializar Husky: `npx husky install`
- [ ] Copiar .env.example: `cp .env.example .env`
- [ ] Preencher variáveis no .env
- [ ] Validar env: `npm run validate:env`
- [ ] Testar lint: `npm run lint`
- [ ] Testar type check: `npm run typecheck`
- [ ] Testar build: `npm run build`
- [ ] Fazer commit de teste
- [ ] Verificar hooks executaram

---

## 🔗 Recursos

- [Husky Documentation](https://typicode.github.io/husky/)
- [Lint-Staged Documentation](https://github.com/okonet/lint-staged)
- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

**Última Atualização**: 2025-01-XX  
**Versão**: 2.0.0  
**Status**: ✅ Produção
