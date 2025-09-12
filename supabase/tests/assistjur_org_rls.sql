-- pgTAP tests for org-based RLS on assistjur tables
BEGIN;
SELECT plan(6);

-- Generate IDs for two orgs and users
SELECT gen_random_uuid() AS org_a \gset
SELECT gen_random_uuid() AS org_b \gset
SELECT gen_random_uuid() AS user_a \gset
SELECT gen_random_uuid() AS user_b \gset

-- User A inserts data for org A
SELECT set_config('request.jwt.claim.sub', :'user_a', true);
SELECT set_config('request.jwt.claim.org_id', :'org_a', true);
SELECT set_config('request.jwt.claim.role', 'advogado', true);

INSERT INTO assistjur.processos (id, numero, org_id)
VALUES (gen_random_uuid(), 'PROC_A', :'org_a');
INSERT INTO assistjur.testemunhas (id, nome, org_id)
VALUES (gen_random_uuid(), 'TEST_A', :'org_a');
INSERT INTO assistjur.provas (id, processo_id, descricao, org_id)
VALUES (gen_random_uuid(), (SELECT id FROM assistjur.processos WHERE numero='PROC_A'), 'PROVA_A', :'org_a');

-- User B (other org) should not access org A data
SELECT set_config('request.jwt.claim.sub', :'user_b', true);
SELECT set_config('request.jwt.claim.org_id', :'org_b', true);
SELECT set_config('request.jwt.claim.role', 'advogado', true);

SELECT is((SELECT count(*) FROM assistjur.processos), 0, 'User B cannot read processos from org A');
SELECT is((SELECT count(*) FROM assistjur.testemunhas), 0, 'User B cannot read testemunhas from org A');
SELECT is((SELECT count(*) FROM assistjur.provas), 0, 'User B cannot read provas from org A');

SELECT throws_ok($$INSERT INTO assistjur.processos (numero, org_id) VALUES ('PROC_BA', :'org_a');$$, 'new row violates row-level security policy for table "processos"', 'User B cannot insert processo for org A');
SELECT throws_ok($$INSERT INTO assistjur.testemunhas (nome, org_id) VALUES ('TEST_BA', :'org_a');$$, 'new row violates row-level security policy for table "testemunhas"', 'User B cannot insert testemunha for org A');
SELECT throws_ok($$INSERT INTO assistjur.provas (descricao, processo_id, org_id) VALUES ('PROVA_BA', (SELECT id FROM assistjur.processos LIMIT 1), :'org_a');$$, 'new row violates row-level security policy for table "provas"', 'User B cannot insert prova for org A');

SELECT finish();
ROLLBACK;
