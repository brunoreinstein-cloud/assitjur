-- pgTAP tests for document sharing RLS
BEGIN;
SELECT plan(2);

-- Prepare sample users and tenant
SELECT gen_random_uuid() AS user_a \gset
SELECT gen_random_uuid() AS user_b \gset
SELECT gen_random_uuid() AS tenant \gset
SELECT gen_random_uuid() AS member_a \gset
SELECT gen_random_uuid() AS member_b \gset

-- Create memberships for users
INSERT INTO public.memberships(id, tenant_id, user_id)
VALUES (:'member_a', :'tenant', :'user_a'),
       (:'member_b', :'tenant', :'user_b');

-- User A context
SELECT set_config('request.jwt.claim.sub', :'user_a', true);
SELECT set_config('request.jwt.claim.tenant_id', :'tenant', true);

INSERT INTO public.documents(tenant_id, owner_id, content)
VALUES (:'tenant', :'user_a', 'segredo')
RETURNING id \gset

-- User B should not see the document before share
SELECT set_config('request.jwt.claim.sub', :'user_b', true);
SELECT set_config('request.jwt.claim.tenant_id', :'tenant', true);
SELECT is( (SELECT count(*) FROM public.documents WHERE id = :'id'), 0, 'B cannot see before share');

-- Grant access to B's membership
SELECT set_config('request.jwt.claim.sub', :'user_a', true);
SELECT set_config('request.jwt.claim.tenant_id', :'tenant', true);
SELECT grant_access(:'id', :'member_b');

-- User B should see the document after share
SELECT set_config('request.jwt.claim.sub', :'user_b', true);
SELECT set_config('request.jwt.claim.tenant_id', :'tenant', true);
SELECT is( (SELECT count(*) FROM public.documents WHERE id = :'id'), 1, 'B can see after share');

SELECT finish();
ROLLBACK;
