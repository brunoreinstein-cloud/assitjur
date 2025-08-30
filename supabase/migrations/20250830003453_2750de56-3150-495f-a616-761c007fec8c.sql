-- Create user invitations table
CREATE TABLE public.user_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'VIEWER',
  data_access_level data_access_level NOT NULL DEFAULT 'NONE',
  invited_by UUID NOT NULL,
  invitation_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'PENDING',
  
  CONSTRAINT unique_org_email_pending UNIQUE (org_id, email, status)
);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage invitations"
ON public.user_invitations
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = user_invitations.org_id 
  AND p.role = 'ADMIN'
));

CREATE POLICY "Users can view invitations sent to their email"
ON public.user_invitations
FOR SELECT
USING (true); -- Allow checking invitations by token

-- Add data_access_level to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'data_access_level') THEN
    ALTER TABLE public.profiles 
    ADD COLUMN data_access_level data_access_level DEFAULT 'NONE';
  END IF;
END $$;

-- Add last_login tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Function to generate secure invitation token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT encode(gen_random_bytes(32), 'base64');
$$;

-- Function to accept invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(
  p_token TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invitation user_invitations%ROWTYPE;
  v_profile_id UUID;
BEGIN
  -- Get invitation
  SELECT * INTO v_invitation
  FROM user_invitations
  WHERE invitation_token = p_token
    AND status = 'PENDING'
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Convite inválido ou expirado'
    );
  END IF;
  
  -- Check if user already has profile in this org
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE user_id = p_user_id
    AND organization_id = v_invitation.org_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Usuário já pertence a esta organização'
    );
  END IF;
  
  -- Create profile
  INSERT INTO profiles (
    user_id,
    email,
    role,
    data_access_level,
    organization_id,
    is_active
  ) VALUES (
    p_user_id,
    v_invitation.email,
    v_invitation.role,
    v_invitation.data_access_level,
    v_invitation.org_id,
    true
  );
  
  -- Mark invitation as accepted
  UPDATE user_invitations
  SET status = 'ACCEPTED',
      accepted_at = now()
  WHERE id = v_invitation.id;
  
  -- Log action
  PERFORM log_user_action(
    'ACCEPT_INVITATION',
    'user_invitations',
    v_invitation.id,
    jsonb_build_object(
      'org_id', v_invitation.org_id,
      'role', v_invitation.role,
      'data_access_level', v_invitation.data_access_level
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Convite aceito com sucesso',
    'org_id', v_invitation.org_id
  );
END;
$$;