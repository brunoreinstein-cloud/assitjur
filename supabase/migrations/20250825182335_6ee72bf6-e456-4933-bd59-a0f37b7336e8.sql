-- Fase 1: Correção de Segurança - Corrigir trigger e função

-- 1. Remover trigger antes de dropar função
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Dropar e recriar função com search_path correto
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (NEW.id, NEW.email, 'VIEWER');
  RETURN NEW;
END;
$$;

-- 3. Recriar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Criar enum para níveis de acesso a dados sensíveis
CREATE TYPE public.data_access_level AS ENUM ('FULL', 'MASKED', 'NONE');

-- 5. Adicionar coluna de nível de acesso a dados na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS data_access_level public.data_access_level DEFAULT 'NONE';