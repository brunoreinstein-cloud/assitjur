-- Ultra-secure beta_signups table implementation
-- This completely locks down direct access while preserving functionality

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Only super admins can view beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Service role only can insert beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Only super admins can update beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Only super admins can delete beta signups" ON public.beta_signups;

-- Create a security definer function for secure beta signup insertion
-- This function can only be called by the beta-signup edge function
CREATE OR REPLACE FUNCTION public.secure_insert_beta_signup(
  p_nome text,
  p_email text,
  p_cargo text,
  p_organizacao text,
  p_necessidades text[],
  p_outro_texto text,
  p_utm jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_existing_id uuid;
BEGIN
  -- Validate input parameters
  IF p_nome IS NULL OR length(trim(p_nome)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nome é obrigatório');
  END IF;
  
  IF p_email IS NULL OR p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email inválido');
  END IF;
  
  IF p_organizacao IS NULL OR length(trim(p_organizacao)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organização é obrigatória');
  END IF;
  
  IF p_necessidades IS NULL OR array_length(p_necessidades, 1) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Necessidades são obrigatórias');
  END IF;

  -- Check for existing email (rate limiting)
  SELECT id INTO v_existing_id 
  FROM beta_signups 
  WHERE email = lower(trim(p_email));
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'E-mail já cadastrado na lista Beta',
      'already_exists', true
    );
  END IF;

  -- Insert the signup securely
  INSERT INTO beta_signups (
    nome, email, cargo, organizacao, necessidades, outro_texto, utm, created_at
  ) VALUES (
    trim(p_nome),
    lower(trim(p_email)),
    NULLIF(trim(p_cargo), ''),
    trim(p_organizacao),
    p_necessidades,
    NULLIF(trim(p_outro_texto), ''),
    COALESCE(p_utm, '{}'::jsonb),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Cadastro realizado com sucesso'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Erro interno do servidor'
  );
END;
$$;

-- Create a security definer function for admin access to beta signups
CREATE OR REPLACE FUNCTION public.get_beta_signups_secure(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
) RETURNS TABLE(
  id uuid,
  nome text,
  email text,
  cargo text,
  organizacao text,
  necessidades text[],
  outro_texto text,
  utm jsonb,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_profile profiles%ROWTYPE;
  v_total_count bigint;
BEGIN
  -- Verify user is a super admin with full access
  SELECT * INTO v_user_profile
  FROM profiles 
  WHERE user_id = auth.uid();
  
  IF v_user_profile IS NULL OR 
     v_user_profile.role != 'ADMIN'::user_role OR 
     v_user_profile.data_access_level != 'FULL'::data_access_level OR
     NOT v_user_profile.is_active THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;

  -- Get total count
  SELECT COUNT(*) INTO v_total_count FROM beta_signups;

  -- Return paginated results
  RETURN QUERY
  SELECT 
    bs.id,
    bs.nome,
    bs.email,
    bs.cargo,
    bs.organizacao,
    bs.necessidades,
    bs.outro_texto,
    bs.utm,
    bs.created_at,
    v_total_count
  FROM beta_signups bs
  ORDER BY bs.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Create ultra-restrictive RLS policies that deny ALL direct access
-- Only the security definer functions above can access the data

-- Completely deny all SELECT access (force use of security definer function)
CREATE POLICY "Deny all direct SELECT access" 
ON public.beta_signups 
FOR SELECT 
USING (false);

-- Completely deny all INSERT access (force use of security definer function)
CREATE POLICY "Deny all direct INSERT access"
ON public.beta_signups
FOR INSERT  
WITH CHECK (false);

-- Completely deny all UPDATE access
CREATE POLICY "Deny all direct UPDATE access"
ON public.beta_signups
FOR UPDATE
USING (false);

-- Completely deny all DELETE access  
CREATE POLICY "Deny all direct DELETE access"
ON public.beta_signups  
FOR DELETE
USING (false);

-- Grant execute permissions on the secure functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_beta_signups_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.secure_insert_beta_signup TO service_role;