-- Fase 1: Finalização - Views mascaradas e políticas para audit_logs

-- 1. Política mais restritiva para audit_logs (apenas super admins)
DROP POLICY IF EXISTS "Admins can view organization audit logs" ON public.audit_logs;

CREATE POLICY "Super admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = audit_logs.organization_id 
    AND p.role = 'ADMIN'
    AND p.data_access_level = 'FULL'
  )
);

-- 2. Criar view para dados mascarados de pessoas
CREATE OR REPLACE VIEW public.pessoas_masked AS
SELECT 
  id,
  org_id,
  CASE 
    WHEN public.can_access_sensitive_data(auth.uid()) THEN nome_civil
    ELSE public.mask_name(nome_civil)
  END as nome_civil,
  CASE 
    WHEN public.can_access_sensitive_data(auth.uid()) THEN cpf_mask
    ELSE public.mask_cpf(cpf_mask)
  END as cpf_mask,
  apelidos,
  created_at,
  updated_at
FROM public.pessoas
WHERE EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = pessoas.org_id
);

-- 3. Criar view para dados mascarados de processos
CREATE OR REPLACE VIEW public.processos_masked AS
SELECT 
  id,
  org_id,
  version_id,
  cnj,
  cnj_normalizado,
  comarca,
  tribunal,
  vara,
  fase,
  status,
  CASE 
    WHEN public.can_access_sensitive_data(auth.uid()) THEN reclamante_nome
    ELSE public.mask_name(reclamante_nome)
  END as reclamante_nome,
  CASE 
    WHEN public.can_access_sensitive_data(auth.uid()) THEN reclamante_cpf_mask
    ELSE public.mask_cpf(reclamante_cpf_mask)
  END as reclamante_cpf_mask,
  CASE 
    WHEN public.can_access_sensitive_data(auth.uid()) THEN reu_nome
    ELSE public.mask_name(reu_nome)
  END as reu_nome,
  advogados_ativo,
  advogados_passivo,
  testemunhas_ativo,
  testemunhas_passivo,
  data_audiencia,
  reclamante_foi_testemunha,
  troca_direta,
  triangulacao_confirmada,
  prova_emprestada,
  score_risco,
  classificacao_final,
  observacoes,
  created_at,
  updated_at,
  deleted_at,
  deleted_by
FROM public.processos
WHERE EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = processos.org_id
);

-- 4. Tabela para histórico de conversas
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. Tabela para mensagens do chat
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- 6. Habilitar RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 7. Políticas para conversations
CREATE POLICY "Users can view their organization conversations" 
ON public.conversations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = conversations.org_id
  )
);

CREATE POLICY "Users can create conversations in their organization" 
ON public.conversations 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = conversations.org_id
  )
);

CREATE POLICY "Users can update their own conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 8. Políticas para messages
CREATE POLICY "Users can view messages from their organization conversations" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN profiles p ON p.organization_id = c.org_id
    WHERE c.id = messages.conversation_id 
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their organization conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN profiles p ON p.organization_id = c.org_id
    WHERE c.id = messages.conversation_id 
    AND p.user_id = auth.uid()
    AND c.user_id = auth.uid()
  )
);

-- 9. Triggers para atualizar timestamps
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Atualizar perfis de admin existentes com acesso completo
UPDATE public.profiles 
SET data_access_level = 'FULL' 
WHERE role = 'ADMIN';