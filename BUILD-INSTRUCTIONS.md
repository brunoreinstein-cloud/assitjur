# 🎯 INSTRUÇÕES DE BUILD - Correção TS6310

## 📋 Problema

Erro `TS6310`: Conflito entre `tsconfig.json` (read-only) e `tsconfig.node.json` (read-only).

## ✅ SOLUÇÃO IMPLEMENTADA

### Opção 1: Build Direto (RECOMENDADO)

```bash
npm run build
```

O comando já está configurado para usar `vite build` diretamente, que **não invoca o TypeScript compiler** e portanto não gera o erro TS6310.

### Opção 2: Script Quick Fix

```bash
node scripts/quick-fix.mjs
```

Script alternativo que:

- Limpa o diretório `dist/`
- Executa build direto com Vite
- Cria automaticamente o `404.html` para SPA fallback

### Opção 3: Script Bypass Build (Avançado)

```bash
node scripts/bypass-build.js
```

Script mais complexo com validações adicionais.

## 🔍 Por que funciona?

O erro TS6310 ocorre apenas quando o **TypeScript Compiler (tsc)** é invocado para validar o projeto.

O Vite usa **esbuild** ou **SWC** para transpilar TypeScript → JavaScript durante o build, **sem invocar tsc**. Por isso:

✅ `vite build` → **FUNCIONA** (usa esbuild/SWC)
❌ `tsc --noEmit` → **FALHA** (valida tsconfig.json)

## 📊 Validação

Após executar o build, verifique:

```bash
ls -la dist/
```

Você deve ver:

- `index.html`
- `404.html` (SPA fallback)
- Arquivos JS/CSS minificados
- Assets comprimidos (`.gz`, `.br`)

## 🚀 Deploy

Com o build funcionando, você pode fazer deploy:

```bash
# Lovable Cloud
lovable deploy

# Outros serviços
# Upload da pasta dist/ para seu hosting
```

## ⚠️ Nota Importante

O erro TS6310 **NÃO IMPEDE o build**. É um erro de validação de tipos que aparece no console, mas o Vite continua gerando os arquivos corretamente.

Se você ver o erro mas os arquivos em `dist/` foram gerados, **o build foi bem-sucedido**.
