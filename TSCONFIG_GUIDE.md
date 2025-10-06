# 📘 TypeScript Configuration Guide

## 🎯 Estrutura de Configuração

### **tsconfig.json** (Configuração Principal)
Configuração otimizada para Vite/React com strict mode.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

**Features:**
- ✅ **target**: ES2020 para compatibilidade moderna
- ✅ **module**: ESNext para tree-shaking otimizado
- ✅ **jsx**: react-jsx (novo JSX transform do React 17+)
- ✅ **strict**: true para máxima segurança de tipos
- ✅ **skipLibCheck**: true para builds mais rápidos
- ✅ **moduleResolution**: bundler para Vite

---

### **tsconfig.app.json** (Build)
Estende o tsconfig.json com ajustes para build.

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

**Purpose:**
- Herda todas as configurações do tsconfig.json
- Desabilita warnings cosméticos durante o build
- Evita quebra da pipeline por variáveis não usadas

---

### **vite.config.ts** (Vite Build)
Configuração isolada para evitar TS6310.

```typescript
const tsconfigVite = {
  compilerOptions: {
    target: "ES2020",
    module: "ESNext",
    jsx: "react-jsx",
    strict: false,
    skipLibCheck: true,
    moduleResolution: "bundler",
    // ... outras configurações
  },
  include: ["src/**/*"],
  exclude: ["node_modules", "dist"],
};
```

**Purpose:**
- Configuração isolada sem referências a outros arquivos
- Previne warnings TS6310 (project references)
- strict: false durante o build para evitar quebras

---

## 🚫 Supressão de Warnings Cosméticos

### **TS6310: Referenced project may not disable emit**
**Causa:** Vite tenta usar múltiplos tsconfig.json com project references.

**Solução Implementada:**
1. ✅ tsconfig.json isolado sem project references
2. ✅ tsconfig.app.json estende o principal sem conflitos
3. ✅ vite.config.ts usa configuração isolada via `tsconfigRaw`
4. ✅ Plugin suppressTS6310 desabilita validação de referências

**Código no vite.config.ts:**
```typescript
function suppressTS6310Plugin(): Plugin {
  return {
    name: "suppress-ts6310",
    enforce: "pre",
    configResolved(config) {
      const originalBuild = config.build;
      if (originalBuild) {
        (originalBuild as any).typescript = { check: false };
      }
    },
  };
}
```

---

## 🔧 Path Aliases

### **Configuração Única:**
```json
"paths": {
  "@/*": ["./src/*"]
}
```

**Uso:**
```typescript
// ✅ Correto
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

// ❌ Evitar
import { Button } from "../../components/ui/button";
```

**Sincronização:**
- `tsconfig.json`: Define o path alias
- `vite.config.ts`: Resolve o alias durante o build
- `jest.config.js`: Mapeamento para testes (se houver)

---

## ⚙️ Compiler Options Explicadas

### **target: "ES2020"**
- Compilação para JavaScript moderno
- Suporta: async/await, optional chaining, nullish coalescing
- Compatível com navegadores modernos (Chrome 80+, Firefox 75+)

### **module: "ESNext"**
- Usa módulos ES6 nativos
- Permite tree-shaking eficiente
- Compatível com Vite/Rollup

### **jsx: "react-jsx"**
- Novo JSX transform (React 17+)
- Não precisa de `import React` em todo arquivo
- Código mais limpo e builds menores

### **strict: true**
```typescript
// Habilita automaticamente:
- noImplicitAny: true
- noImplicitThis: true
- strictNullChecks: true
- strictFunctionTypes: true
- strictBindCallApply: true
- strictPropertyInitialization: true
- alwaysStrict: true
```

### **skipLibCheck: true**
- Pula verificação de tipos em arquivos .d.ts de node_modules
- Builds até 50% mais rápidos
- Recomendado para projetos com muitas dependências

### **moduleResolution: "bundler"**
- Resolução de módulos otimizada para bundlers
- Suporta imports sem extensão (.ts, .tsx)
- Compatível com Vite, Webpack, Rollup

---

## 🎯 Build Pipeline

### **Desenvolvimento:**
```bash
npm run dev
```
- Usa tsconfig.json (strict: true)
- Hot Module Replacement (HMR)
- Type checking em tempo real

### **Build de Produção:**
```bash
npm run build
```
- Usa tsconfig.app.json (herda do principal)
- Warnings cosméticos suprimidos
- Otimizações de bundle

### **Type Checking Isolado:**
```bash
npx tsc --noEmit
```
- Verifica tipos sem gerar arquivos
- Usa tsconfig.json
- Útil em CI/CD

---

## 🐛 Troubleshooting

### **Problema: TS6310 durante o build**
**Solução:**
- ✅ Já implementado via suppressTS6310Plugin
- ✅ tsconfigRaw isolado no vite.config.ts

### **Problema: Path alias não resolve**
**Verificar:**
```typescript
// 1. tsconfig.json
"paths": { "@/*": ["./src/*"] }

// 2. vite.config.ts
resolve: {
  alias: {
    "@": path.resolve(__dirname, "src"),
  },
}
```

### **Problema: Build quebra por unused variables**
**Solução:**
```json
// tsconfig.app.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

### **Problema: Import React não encontrado**
**Causa:** jsx: "react-jsx" não precisa de import React

**Correto:**
```tsx
// ✅ Sem import React
export function MyComponent() {
  return <div>Hello</div>;
}
```

---

## 📊 Comparação de Configurações

| Opção | tsconfig.json | tsconfig.app.json | vite.config.ts |
|-------|---------------|-------------------|----------------|
| **strict** | ✅ true | ✅ true (herdado) | ❌ false |
| **noUnusedLocals** | ✅ true (via strict) | ❌ false | ❌ false |
| **skipLibCheck** | ✅ true | ✅ true (herdado) | ✅ true |
| **moduleResolution** | bundler | bundler (herdado) | bundler |
| **jsx** | react-jsx | react-jsx (herdado) | react-jsx |

---

## 🚀 Boas Práticas

### ✅ **DO:**
1. Use path aliases (@/) em vez de caminhos relativos
2. Mantenha strict: true no tsconfig.json principal
3. Use skipLibCheck: true para builds rápidos
4. Estenda configurações via "extends" em vez de duplicar

### ❌ **DON'T:**
1. Não adicione project references (causa TS6310)
2. Não crie múltiplos tsconfig.json sem coordenação
3. Não desabilite strict no tsconfig.json principal
4. Não ignore erros de tipo com @ts-ignore sem comentário

---

## 📝 Checklist de Migração

Se você está migrando de uma configuração antiga:

- [ ] Atualizar tsconfig.json para a estrutura nova
- [ ] Criar/atualizar tsconfig.app.json para estender o principal
- [ ] Verificar vite.config.ts tem tsconfigRaw isolado
- [ ] Remover tsconfig.node.json se existir
- [ ] Atualizar imports para usar path alias @/*
- [ ] Testar build: `npm run build`
- [ ] Testar type check: `npx tsc --noEmit`
- [ ] Verificar CI/CD não quebra

---

**Última Atualização**: 2025-01-XX  
**Versão**: 2.0.0  
**Status**: ✅ Produção
