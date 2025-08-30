-- First, let's check if there's a mismatch in foreign key references
-- Remove the problematic foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'processos_version_id_fkey' 
               AND table_name = 'processos') THEN
        ALTER TABLE public.processos DROP CONSTRAINT processos_version_id_fkey;
    END IF;
END $$;

-- Add the correct foreign key reference to the versions table (not dataset_versions)
ALTER TABLE public.processos 
ADD CONSTRAINT processos_version_id_fkey 
FOREIGN KEY (version_id) REFERENCES public.versions(id) ON DELETE SET NULL;

-- Ensure the versions table exists with proper structure
CREATE TABLE IF NOT EXISTS public.versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL,
    number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    summary JSONB DEFAULT '{}',
    created_by UUID,
    file_checksum TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(org_id, number)
);

-- Enable RLS on versions table if not already enabled
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for versions table if they don't exist
DO $$
BEGIN
    -- Check if the policy exists before creating it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'versions' 
        AND policyname = 'Only admins can manage versions'
    ) THEN
        CREATE POLICY "Only admins can manage versions" ON public.versions
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.user_id = auth.uid()
                AND profiles.organization_id = versions.org_id
                AND profiles.role = 'ADMIN'
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'versions' 
        AND policyname = 'Users can view org versions'
    ) THEN
        CREATE POLICY "Users can view org versions" ON public.versions
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.user_id = auth.uid()
                AND profiles.organization_id = versions.org_id
            )
        );
    END IF;
END $$;