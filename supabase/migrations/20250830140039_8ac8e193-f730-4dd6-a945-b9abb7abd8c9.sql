-- Step 1: Remove ALL existing foreign key constraints on processos.version_id
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'processos' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%version%'
    LOOP
        EXECUTE 'ALTER TABLE public.processos DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
    END LOOP;
END $$;

-- Step 2: Set all version_id to NULL temporarily
UPDATE public.processos SET version_id = NULL;

-- Step 3: Create default version for each organization
INSERT INTO public.versions (org_id, number, status, created_at, summary)
SELECT DISTINCT 
    org_id,
    1 as number,
    'published' as status,
    NOW() as created_at,
    jsonb_build_object('imported', 'legacy data', 'processos', COUNT(*))
FROM public.processos 
WHERE org_id IS NOT NULL
GROUP BY org_id
ON CONFLICT (org_id, number) DO NOTHING;

-- Step 4: Update processos to reference the default version
UPDATE public.processos p
SET version_id = v.id
FROM public.versions v
WHERE p.org_id = v.org_id 
AND v.number = 1;

-- Step 5: Add the correct foreign key constraint
ALTER TABLE public.processos 
ADD CONSTRAINT processos_version_id_fkey 
FOREIGN KEY (version_id) REFERENCES public.versions(id) ON DELETE SET NULL;