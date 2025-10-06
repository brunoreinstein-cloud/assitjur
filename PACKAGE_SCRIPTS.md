# 📦 Scripts do Package.json

Como o `package.json` é read-only no Lovable, aqui estão os scripts que devem ser adicionados manualmente via GitHub ou localmente:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "npm run validate:env && tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,md}\"",
    "typecheck": "tsc --noEmit",
    "validate:env": "node scripts/validate-env.js",
    "validate": "npm run lint && npm run typecheck && npm run validate:env",
    "ci": "npm run validate && npm run build",
    "prepare": "husky install"
  }
}
```

## 📝 Descrição dos Scripts

### **Desenvolvimento**
- `dev`: Inicia servidor de desenvolvimento
- `build`: Build de produção com validação de env
- `preview`: Preview do build local

### **Qualidade**
- `lint`: Verifica com ESLint
- `lint:fix`: Corrige automaticamente
- `format`: Formata com Prettier
- `format:check`: Verifica formatação
- `typecheck`: Verifica tipos TypeScript

### **Validação**
- `validate:env`: Valida variáveis obrigatórias
- `validate`: Lint + Type + Env
- `ci`: Pipeline completa

### **Git Hooks**
- `prepare`: Instala Husky após npm install

---

**Última Atualização**: 2025-01-XX  
**Versão**: 2.0.0
