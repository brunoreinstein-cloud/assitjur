-- Step 1: Handle existing data with invalid version_id references
-- Set version_id to NULL for records that reference non-existent versions
UPDATE public.processos 
SET version_id = NULL 
WHERE version_id IS NOT NULL 
AND version_id NOT IN (SELECT id FROM public.versions WHERE id IS NOT NULL);

-- Step 2: Create a default version for the organization if needed
INSERT INTO public.versions (org_id, number, status, created_at, summary)
SELECT DISTINCT 
    org_id,
    1 as number,
    'published' as status,
    NOW() as created_at,
    '{"imported": "existing data", "processos": 0}'::jsonb as summary
FROM public.processos 
WHERE org_id IS NOT NULL
ON CONFLICT (org_id, number) DO NOTHING;

-- Step 3: Update processos to reference the default version
UPDATE public.processos p
SET version_id = v.id
FROM public.versions v
WHERE p.org_id = v.org_id 
AND v.number = 1
AND p.version_id IS NULL;

-- Step 4: Now safely add the foreign key constraint
ALTER TABLE public.processos 
ADD CONSTRAINT processos_version_id_fkey 
FOREIGN KEY (version_id) REFERENCES public.versions(id) ON DELETE SET NULL;