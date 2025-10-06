-- =====================================================
-- QUERIES PARA MAPEAR SCHEMA REAL DAS VIEWS
-- Execute no Supabase SQL Editor e compartilhe os resultados
-- =====================================================

-- 1️⃣ Schema da view assistjur.por_processo_view
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'assistjur' 
  AND table_name = 'por_processo_view'
ORDER BY ordinal_position;

-- 2️⃣ Schema da view assistjur.por_testemunha_view
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'assistjur' 
  AND table_name = 'por_testemunha_view'
ORDER BY ordinal_position;

-- 3️⃣ Sample data de por_processo_view (primeiras 3 linhas)
SELECT * FROM assistjur.por_processo_view LIMIT 3;

-- 4️⃣ Sample data de por_testemunha_view (primeiras 3 linhas)
SELECT * FROM assistjur.por_testemunha_view LIMIT 3;

-- 5️⃣ Verificar se as views existem
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'assistjur'
  AND viewname IN ('por_processo_view', 'por_testemunha_view');
