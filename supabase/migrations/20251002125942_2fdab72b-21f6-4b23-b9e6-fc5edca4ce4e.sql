-- ============================================
-- FASE 2.1: Extensão da tabela profiles
-- ============================================
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS email_notifications JSONB DEFAULT '{"system_alerts": true, "weekly_reports": true, "security_alerts": true}'::jsonb;

-- Index para busca por nome
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);

-- ============================================
-- FASE 2.2: Extensão da tabela organizations
-- ============================================
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#2563eb',
  ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#1e40af',
  ADD COLUMN IF NOT EXISTS session_timeout_minutes INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS allow_concurrent_sessions BOOLEAN DEFAULT true;

-- Index para busca por CNPJ
CREATE INDEX IF NOT EXISTS idx_organizations_cnpj ON organizations(cnpj) WHERE cnpj IS NOT NULL;

-- ============================================
-- FASE 2.3: Storage Buckets
-- ============================================

-- Bucket para avatars de usuários (2MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para logos de organizações (5MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-logos',
  'org-logos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FASE 2.4: RLS Policies for avatars bucket
-- ============================================

DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
  
  -- Create new policies for avatars
  CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

  CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

  CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

  CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
END $$;

-- ============================================
-- FASE 2.5: RLS Policies for org-logos bucket
-- ============================================

DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Admins can upload org logos" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can update org logos" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can delete org logos" ON storage.objects;
  DROP POLICY IF EXISTS "Org logos are publicly readable" ON storage.objects;
  
  -- Create new policies for org-logos
  CREATE POLICY "Admins can upload org logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'org-logos'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'ADMIN'
        AND p.organization_id::text = (storage.foldername(name))[1]
    )
  );

  CREATE POLICY "Admins can update org logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'org-logos'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'ADMIN'
        AND p.organization_id::text = (storage.foldername(name))[1]
    )
  );

  CREATE POLICY "Admins can delete org logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'org-logos'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'ADMIN'
        AND p.organization_id::text = (storage.foldername(name))[1]
    )
  );

  CREATE POLICY "Org logos are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'org-logos');
END $$;