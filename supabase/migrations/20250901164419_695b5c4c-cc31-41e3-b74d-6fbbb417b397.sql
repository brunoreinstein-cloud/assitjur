-- Update org_id of existing data in assistjur.por_processo_staging to match current user's organization
UPDATE assistjur.por_processo_staging 
SET org_id = 'f794ba63-47ba-4a04-ba57-dffe0de045c0'
WHERE org_id = '11111111-1111-1111-1111-111111111111';