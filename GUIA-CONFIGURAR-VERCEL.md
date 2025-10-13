# 🚀 Guia Completo - Configurar Variáveis de Ambiente na Vercel

**Problema:** Erro "Configuração Incompleta" - Variáveis de ambiente obrigatórias não encontradas.

**Solução:** Configurar as variáveis no dashboard da Vercel.

---

## 📋 **Passo a Passo - Configurar na Vercel**

### **1. Acessar o Dashboard da Vercel**

1. Abra: https://vercel.com/dashboard
2. Faça login na sua conta
3. Encontre o projeto **assitjur** na lista

### **2. Configurar Variáveis de Ambiente**

1. **Clique no projeto** para abrir
2. Vá para **Settings** (ícone de engrenagem)
3. Clique em **Environment Variables** no menu lateral

### **3. Adicionar Variáveis Obrigatórias**

Clique em **"Add New"** e adicione cada variável:

#### **🔑 VITE_SUPABASE_URL**
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://fgjypmlszuzkgvhuszxn.supabase.co`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### **🔑 VITE_SUPABASE_ANON_KEY**
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnanlwbWxzenV6a2d2aHVzenhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzE4MjQsImV4cCI6MjA3MTYwNzgyNH0.lN-Anhn1e-2SCDIAe6megYRHdhofe1VO71D6-Zk70XU`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

### **4. Variáveis Opcionais (Recomendadas)**

#### **🌐 VITE_PUBLIC_SITE_URL**
- **Name:** `VITE_PUBLIC_SITE_URL`
- **Value:** `https://seu-projeto.vercel.app` (substitua pelo seu domínio)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### **🛡️ VITE_MAINTENANCE**
- **Name:** `VITE_MAINTENANCE`
- **Value:** `false`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

### **5. Salvar e Fazer Deploy**

1. **Clique em "Save"** para cada variável
2. Vá para a aba **Deployments**
3. Clique em **"Redeploy"** no último deployment
4. Ou faça um novo commit para triggerar um novo deploy

---

## 🔍 **Verificação**

### **Após o Deploy:**

1. **Acesse o site** deployado
2. **Abra o Console** (F12)
3. **Digite:** `console.log(import.meta.env.VITE_SUPABASE_URL)`
4. **Resultado esperado:** Deve mostrar a URL do Supabase

### **Se ainda houver erro:**

1. **Verifique** se todas as variáveis foram salvas
2. **Confirme** que estão marcadas para Production
3. **Aguarde** 2-3 minutos para o cache atualizar
4. **Faça um novo deploy** se necessário

---

## 📝 **Valores das Variáveis**

### **Supabase (Obrigatórias):**
```env
VITE_SUPABASE_URL=https://fgjypmlszuzkgvhuszxn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnanlwbWxzenV6a2d2aHVzenhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzE4MjQsImV4cCI6MjA3MTYwNzgyNH0.lN-Anhn1e-2SCDIAe6megYRHdhofe1VO71D6-Zk70XU
```

### **Site (Opcionais):**
```env
VITE_PUBLIC_SITE_URL=https://seu-projeto.vercel.app
VITE_MAINTENANCE=false
```

---

## 🚨 **Troubleshooting**

### **Erro: "Variáveis de ambiente inválidas"**

**Causa:** URL do Supabase mal formatada
**Solução:** 
- Verifique se não há espaços extras
- Confirme que a URL começa com `https://`
- Certifique-se de que não há `/` no final

### **Erro: "Build falha"**

**Causa:** Variáveis não configuradas para o ambiente correto
**Solução:**
- Marque todas as variáveis para **Production**
- Faça um novo deploy após salvar

### **Erro: "Site em branco"**

**Causa:** Variáveis não carregadas no frontend
**Solução:**
- Verifique se as variáveis começam com `VITE_`
- Confirme que foram salvas no dashboard
- Aguarde alguns minutos para o cache atualizar

---

## ✅ **Checklist Final**

- [ ] Acessei o dashboard da Vercel
- [ ] Encontrei o projeto assitjur
- [ ] Fui em Settings > Environment Variables
- [ ] Adicionei `VITE_SUPABASE_URL`
- [ ] Adicionei `VITE_SUPABASE_ANON_KEY`
- [ ] Marquei todas para Production/Preview/Development
- [ ] Salvei todas as variáveis
- [ ] Fiz um novo deploy
- [ ] Testei o site deployado
- [ ] Verifiquei no console que as variáveis estão carregadas

---

## 🎉 **Resultado Esperado**

Após configurar as variáveis:

1. ✅ **Build bem-sucedido** na Vercel
2. ✅ **Site carregando** sem erros
3. ✅ **Console limpo** (sem erros de variáveis)
4. ✅ **Funcionalidades** do Supabase funcionando

---

**📞 Suporte:** Se ainda houver problemas, verifique os logs de build na Vercel para mais detalhes.
