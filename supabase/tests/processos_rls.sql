-- pgTAP tests for processos RLS with security invoker views
BEGIN;
SELECT plan(2);

-- Generate IDs for tenants and users
SELECT gen_random_uuid() AS tenant_a \gset
SELECT gen_random_uuid() AS tenant_b \gset
SELECT gen_random_uuid() AS user_a \gset
SELECT gen_random_uuid() AS user_b \gset

-- User A inserts a processo for tenant A
SELECT set_config('request.jwt.claim.sub', :'user_a', true);
SELECT set_config('request.jwt.claim.tenant_id', :'tenant_a', true);
INSERT INTO public.processos (org_id, cnj, cnj_normalizado)
VALUES (:'tenant_a', 'A-123', 'A-123');

-- User B inserts a processo for tenant B
SELECT set_config('request.jwt.claim.sub', :'user_b', true);
SELECT set_config('request.jwt.claim.tenant_id', :'tenant_b', true);
INSERT INTO public.processos (org_id, cnj, cnj_normalizado)
VALUES (:'tenant_b', 'B-456', 'B-456');

-- User A should see only their processos via view
SELECT set_config('request.jwt.claim.sub', :'user_a', true);
SELECT set_config('request.jwt.claim.tenant_id', :'tenant_a', true);
SELECT is( (SELECT count(*) FROM public.vw_processos_publicos), 1, 'User A sees own processos');

-- User B should not see User A's processo
SELECT set_config('request.jwt.claim.sub', :'user_b', true);
SELECT set_config('request.jwt.claim.tenant_id', :'tenant_b', true);
SELECT is( (SELECT count(*) FROM public.vw_processos_publicos WHERE cnj = 'A-123'), 0, 'User B cannot see A\'s processo');

SELECT finish();
ROLLBACK;
