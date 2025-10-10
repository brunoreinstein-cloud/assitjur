# 🔧 Guia de Troubleshooting - AssistJur.IA

## 🚨 Problemas Comuns e Soluções

### **1. Preview em Branco / Não Carrega**

#### **Sintomas:**
- Página em branco no preview
- Servidor rodando mas sem resposta
- Erro 404 ou timeout

#### **Soluções:**

**A. Verificar Configuração de Base URL**
```bash
# Verificar vite.config.ts
# Deve estar: base: "/"
# NÃO: base: "./"
```

**B. Verificar Referências CSS**
```html
<!-- ❌ ERRADO - Remover estas linhas do index.html -->
<link rel="preload" as="style" href="/src/index.css" />
<link rel="stylesheet" href="/src/index.css" />

<!-- ✅ CORRETO - Deixar Vite gerenciar -->
<!-- CSS será injetado pelo Vite -->
```

**C. Limpar e Rebuildar**
```bash
pnpm run clean
pnpm install
pnpm run build
pnpm run preview
```

### **2. Erro de Variáveis de Ambiente**

#### **Sintomas:**
- "Variáveis de ambiente inválidas ou faltando"
- Build falha na validação
- Aplicação não inicializa

#### **Soluções:**

**A. Verificar Arquivo .env**
```bash
# Verificar se .env existe
dir .env

# Se não existir, criar baseado no exemplo
copy .env.example .env
```

**B. Configurar Variáveis Obrigatórias**
```bash
# .env deve conter:
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

**C. Validar Configuração**
```bash
pnpm run validate:env
```

### **3. Erro de Compilação TypeScript**

#### **Sintomas:**
- Erro TS2307: Cannot find module
- Imports quebrados
- Build falha

#### **Soluções:**

**A. Verificar Imports**
```typescript
// ❌ ERRADO
import { isClient } from "@/lib/ssr-safe-utils";

// ✅ CORRETO
import { isClient } from "@/lib/ssr-utils";
```

**B. Verificar tsconfig.json**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### **4. CSS Não Carrega / Layout Quebrado**

#### **Sintomas:**
- Página sem estilos
- Layout completamente quebrado
- Console mostra erros de CSS

#### **Soluções:**

**A. Verificar Tailwind Config**
```typescript
// tailwind.config.ts
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  // ...
}
```

**B. Verificar CSS Principal**
```css
/* src/index.css deve conter: */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**C. Verificar Imports no main.tsx**
```typescript
// src/main.tsx
import "./styles/assistjur-brand.css";
// CSS principal será injetado automaticamente
```

### **5. Problemas de Roteamento**

#### **Sintomas:**
- Erro 404 em todas as rotas
- Navegação não funciona
- Router não inicializa

#### **Soluções:**

**A. Verificar Router Selection**
```typescript
// src/App.tsx - linha 247
const Router = import.meta.env.VITE_USE_HASH_ROUTER === 'true' ? HashRouter : BrowserRouter;
```

**B. Verificar Configuração do Vite**
```typescript
// vite.config.ts
export default defineConfig({
  base: "/", // ✅ CORRETO
  // ...
});
```

### **6. Problemas de Performance**

#### **Sintomas:**
- Build muito lento
- Chunks muito grandes
- Avisos de tamanho

#### **Soluções:**

**A. Otimizar Chunks**
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes("node_modules")) {
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("react")) return "vendor-react";
          return "vendor";
        }
      }
    }
  }
}
```

**B. Code Splitting**
```typescript
// Usar lazy loading para páginas pesadas
const HeavyPage = lazy(() => import("@/pages/HeavyPage"));
```

## 🔍 **Comandos de Diagnóstico**

### **Verificar Estado do Projeto**
```bash
# 1. Verificar arquivos de ambiente
dir .env*

# 2. Verificar build
pnpm run build

# 3. Verificar preview
pnpm run preview

# 4. Verificar servidores ativos
netstat -an | findstr :4173
netstat -an | findstr :8080
```

### **Testar Conectividade**
```bash
# Testar preview
Invoke-WebRequest -Uri "http://localhost:4173" -Method Head

# Testar dev
Invoke-WebRequest -Uri "http://localhost:8080" -Method Head
```

### **Limpeza Completa**
```bash
# Limpar tudo e reinstalar
pnpm run clean
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force dist
pnpm install
pnpm run build
```

## 📊 **Checklist de Verificação**

### **Antes de Fazer Deploy:**
- [ ] Build executa sem erros
- [ ] Preview responde com Status 200
- [ ] CSS carrega corretamente
- [ ] Variáveis de ambiente validadas
- [ ] Roteamento funciona
- [ ] Console sem erros críticos

### **Em Caso de Problemas:**
- [ ] Verificar console do navegador
- [ ] Verificar logs do servidor
- [ ] Verificar arquivos de configuração
- [ ] Testar em modo desenvolvimento
- [ ] Verificar dependências

## 🆘 **Contato e Suporte**

### **Logs Importantes:**
```bash
# Logs de build
pnpm run build 2>&1 | Tee-Object -FilePath build.log

# Logs de preview
pnpm run preview 2>&1 | Tee-Object -FilePath preview.log
```

### **Informações para Suporte:**
- Versão do Node: `node --version`
- Versão do pnpm: `pnpm --version`
- Sistema Operacional: `$env:OS`
- Arquivos de configuração: `.env`, `vite.config.ts`, `tsconfig.json`

---

**Última atualização**: $(Get-Date)  
**Versão do projeto**: 0.0.0  
**Status**: ✅ Funcionando
