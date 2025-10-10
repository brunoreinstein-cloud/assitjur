# 🚀 Guia de Deploy na Vercel - AssistJur

## 📋 **Pré-requisitos Completados**

✅ **Configurações corrigidas:**
- `vercel.json` configurado para `pnpm`
- Fallbacks SPA (`200.html`, `404.html`) criados
- Scripts de deploy adicionados
- Cache limpo e dependências reinstaladas
- Build local testado e funcionando

## 🔐 **Passo 1: Login na Vercel**

Execute o comando e siga as instruções:

```bash
vercel login
```

**O que acontecerá:**
1. CLI mostrará uma URL como: `https://vercel.com/oauth/device?user_code=XXXX-XXXX`
2. Pressione `ENTER` para abrir o navegador
3. Faça login na sua conta Vercel
4. Autorize o CLI

## 🔗 **Passo 2: Linkar o Projeto**

Após o login, execute:

```bash
vercel link
```

**O que acontecerá:**
1. CLI perguntará se você quer linkar a um projeto existente
2. Selecione "Yes" e escolha o projeto `assitjur`
3. Se não existir, crie um novo projeto

## 🧪 **Passo 3: Deploy Preview (Teste)**

```bash
pnpm run deploy:preview
```

**O que acontecerá:**
1. Build será executado localmente
2. Deploy será feito para um ambiente de preview
3. Você receberá uma URL temporária para testar

## 🚀 **Passo 4: Deploy Produção**

```bash
pnpm run deploy
```

**O que acontecerá:**
1. Build será executado localmente
2. Deploy será feito para produção
3. Site estará disponível no domínio principal

## 🔍 **Verificações Pós-Deploy**

### **Teste as seguintes rotas:**
- ✅ Página inicial: `https://assitjur.vercel.app/`
- ✅ Login: `https://assitjur.vercel.app/login`
- ✅ Sobre: `https://assitjur.vercel.app/sobre`
- ✅ Dashboard: `https://assitjur.vercel.app/app/dashboard`

### **Verifique no console do navegador:**
- ✅ Sem erros JavaScript
- ✅ Assets carregando corretamente
- ✅ Rotas SPA funcionando

## 🚨 **Se Houver Problemas**

### **Erro de Autenticação:**
```bash
# Limpar credenciais e tentar novamente
vercel logout
vercel login
```

### **Erro de Build:**
```bash
# Verificar build local primeiro
pnpm run build
```

### **Erro de Deploy:**
```bash
# Verificar logs
vercel logs
```

## 📊 **Comandos Úteis**

```bash
# Ver status do projeto
vercel ls

# Ver logs de deploy
vercel logs

# Fazer deploy forçado
vercel --force

# Ver informações do projeto
vercel inspect
```

## 🎯 **Resultado Esperado**

Após completar todos os passos:

1. **Site funcionando** em `https://assitjur.vercel.app/`
2. **Rotas SPA funcionando** (sem 404)
3. **Assets carregando** corretamente
4. **Console limpo** (sem erros JavaScript)
5. **Performance otimizada** com cache headers

## 📞 **Suporte**

Se encontrar problemas:
1. Verifique os logs: `vercel logs`
2. Teste build local: `pnpm run build`
3. Consulte o relatório: `VERCEL-DEPLOYMENT-FIX-REPORT.md`

---

**🎉 Com as correções aplicadas, o deploy deve funcionar perfeitamente!**
