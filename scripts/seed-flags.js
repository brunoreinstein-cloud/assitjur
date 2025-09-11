import { createClient } from '@supabase/supabase-js';

// simple argument parsing
const args = process.argv.slice(2).reduce((acc, cur) => {
  const [key, value] = cur.replace(/^--/, '').split('=');
  acc[key] = value;
  return acc;
}, {});

const tenantId = args.tenant;
let envArg = args.env || 'production';

const envMap = {
  prod: 'production',
  production: 'production',
  staging: 'staging',
  dev: 'development',
  development: 'development',
};

const environment = envMap[envArg];

if (!tenantId || !environment) {
  console.error('Usage: node scripts/seed-flags.js --tenant=<id> --env=<dev|staging|prod>');
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const FLAGS = [
  {
    id: '1c0a7b45-0fdc-4e9e-9d6e-8f41185b7a2d',
    flag: 'advanced-report',
    enabled: true,
    rollout_percentage: 100,
    environments: ['development', 'staging', 'production'],
  },
  {
    id: '8e7b21bf-5024-4a0f-80bd-0cb2d040b59e',
    flag: 'beta-dashboard',
    enabled: false,
    rollout_percentage: 0,
    environments: ['development', 'staging'],
  },
];

const rows = FLAGS.filter((f) => f.environments.includes(environment)).map((f) => ({
  id: f.id,
  tenant_id: tenantId,
  flag: f.flag,
  enabled: f.enabled,
  rollout_percentage: f.rollout_percentage,
  environment,
}));

if (rows.length === 0) {
  console.log(`No flags to seed for env ${environment}`);
  process.exit(0);
}

const { error } = await supabase
  .from('feature_flags')
  .upsert(rows, { onConflict: 'tenant_id,id' });

if (error) {
  console.error('Failed to upsert flags', error);
  process.exit(1);
}

console.log(`Seeded ${rows.length} flags for tenant ${tenantId} in ${environment}`);
