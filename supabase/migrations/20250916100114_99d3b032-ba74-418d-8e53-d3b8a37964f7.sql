-- CORREÇÃO CRÍTICA 1: Resolver Recursão Infinita nas Políticas RLS da tabela profiles
-- Remover políticas conflitantes e implementar política única e simples

-- Remover todas as políticas existentes da tabela profiles que podem causar recursão
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_org_members_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_simple_access" ON public.profiles;
DROP POLICY IF EXISTS "service_role_full_access" ON public.profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.profiles;

-- Criar função security definer para verificar se usuário é admin (evita recursão)
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = check_user_id 
    AND p.role = 'ADMIN' 
    AND p.is_active = true
  );
$$;

-- Implementar políticas RLS simples e sem recursão
CREATE POLICY "users_view_own_profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_insert_own_profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Administradores podem ver perfis da mesma organização (usando função security definer)
CREATE POLICY "admins_view_org_profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() != user_id AND 
  is_user_admin(auth.uid()) AND
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Service role tem acesso total
CREATE POLICY "service_role_full_profiles_access" 
ON public.profiles 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- CORREÇÃO CRÍTICA 2: Corrigir funções restantes sem search_path
-- Atualizar função ensure_user_profile para ter search_path seguro
CREATE OR REPLACE FUNCTION public.ensure_user_profile(
  user_uuid uuid,
  user_email text,
  user_role user_role DEFAULT 'VIEWER',
  org_id uuid DEFAULT NULL
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_profile profiles%ROWTYPE;
  new_profile profiles%ROWTYPE;
BEGIN
  -- Try to get existing profile
  SELECT * INTO existing_profile
  FROM profiles 
  WHERE user_id = user_uuid;
  
  IF FOUND THEN
    RETURN existing_profile;
  END IF;
  
  -- Create new profile if it doesn't exist
  INSERT INTO profiles (
    user_id, 
    email, 
    role, 
    organization_id, 
    is_active,
    data_access_level
  ) VALUES (
    user_uuid, 
    user_email, 
    user_role, 
    org_id, 
    true,
    CASE 
      WHEN user_role = 'ADMIN' THEN 'FULL'::data_access_level
      WHEN user_role = 'ANALYST' THEN 'MASKED'::data_access_level
      ELSE 'NONE'::data_access_level
    END
  )
  RETURNING * INTO new_profile;
  
  RETURN new_profile;
END;
$$;

-- Corrigir função calculate_next_cleanup para ter search_path
CREATE OR REPLACE FUNCTION public.calculate_next_cleanup(
  last_cleanup timestamp with time zone,
  retention_months integer
)
RETURNS timestamp with time zone
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT last_cleanup + (retention_months || ' months')::interval;
$$;

-- CORREÇÃO CRÍTICA 3: Adicionar RLS políticas faltantes para service_role
-- Política para service_role acessar rate_limit_counters
CREATE POLICY IF NOT EXISTS "service_role_rate_limit_counters_access"
ON public.rate_limit_counters
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Política para service_role acessar rate_limit_hits  
CREATE POLICY IF NOT EXISTS "service_role_rate_limit_hits_access"
ON public.rate_limit_hits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- CORREÇÃO CRÍTICA 4: Função RPC para verificar rate limit com search_path correto
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_limit integer DEFAULT 20,
  p_window_ms integer DEFAULT 60000
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
  v_window_start timestamp with time zone;
BEGIN
  v_window_start := now() - (p_window_ms || ' milliseconds')::interval;
  
  -- Count recent requests
  SELECT COUNT(*) INTO v_count
  FROM rate_limit_hits
  WHERE subject_id = p_key
    AND created_at > v_window_start;
  
  -- Insert current request
  INSERT INTO rate_limit_hits (subject_id, route)
  VALUES (p_key, 'api');
  
  -- Return true if under limit
  RETURN v_count < p_limit;
END;
$$;