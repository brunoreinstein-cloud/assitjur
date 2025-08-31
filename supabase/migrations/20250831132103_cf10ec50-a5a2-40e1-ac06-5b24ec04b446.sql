-- Address remaining critical security issues

-- 1. For processos_live view: Since we can't add RLS directly to views,
-- we need to ensure it's properly protected by creating a security barrier view
-- or updating the view definition to include security checks

-- First, let's see what processos_live currently looks like and recreate it with security
-- Drop the existing view and recreate with security definer and proper filtering
DROP VIEW IF EXISTS processos_live;

-- Create a secure version of processos_live that includes the same RLS logic as processos table
CREATE VIEW processos_live
WITH (security_barrier = true)
AS SELECT 
  p.id,
  p.org_id,
  p.version_id,
  p.cnj,
  p.cnj_normalizado,
  p.cnj_digits,
  p.comarca,
  p.tribunal,
  p.vara,
  p.fase,
  p.status,
  CASE 
    WHEN can_access_sensitive_data(auth.uid()) THEN p.reclamante_nome
    ELSE mask_name(p.reclamante_nome)
  END as reclamante_nome,
  p.reclamante_cpf_mask,
  CASE 
    WHEN can_access_sensitive_data(auth.uid()) THEN p.reu_nome
    ELSE mask_name(p.reu_nome)
  END as reu_nome,
  p.advogados_ativo,
  p.advogados_passivo,
  p.testemunhas_ativo,
  p.testemunhas_passivo,
  p.data_audiencia,
  p.reclamante_foi_testemunha,
  p.troca_direta,
  p.triangulacao_confirmada,
  p.prova_emprestada,
  p.classificacao_final,
  p.score_risco,
  p.observacoes,
  p.created_at,
  p.updated_at,
  p.deleted_at,
  p.deleted_by
FROM processos p
WHERE EXISTS (
  SELECT 1 FROM profiles pr
  WHERE pr.user_id = auth.uid() 
  AND pr.organization_id = p.org_id
  AND can_access_sensitive_data(auth.uid())
);

-- 2. Add additional security for beta_signups
-- Create a rate limiting policy to prevent abuse
CREATE OR REPLACE FUNCTION check_beta_signup_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this email has signed up recently (within 24 hours)
  IF EXISTS (
    SELECT 1 FROM beta_signups 
    WHERE email = NEW.email 
    AND created_at > now() - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded: Email already signed up recently';
  END IF;
  
  -- Check if too many signups from same IP (if we had IP tracking)
  -- This would require adding an ip_address column, which we won't do now
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Add trigger for rate limiting
CREATE TRIGGER beta_signup_rate_limit
  BEFORE INSERT ON beta_signups
  FOR EACH ROW EXECUTE FUNCTION check_beta_signup_rate_limit();

-- Update comments to reflect new security measures
COMMENT ON VIEW processos_live IS 'Secure live processes view - includes RLS filtering and data masking based on user permissions';
COMMENT ON TABLE beta_signups IS 'Beta signup data - Rate limited public inserts, admin-only read access with audit logging';