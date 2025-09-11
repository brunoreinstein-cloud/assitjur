# Feature Flags Runbook

This runbook describes how to manage feature flags and seed them in Supabase.

## Seeding flags

The Supabase `feature_flags` table uses a `rollout_percentage` column to
control gradual rollouts. Values range from `0` (disabled for all users)
through `100` (enabled for everyone).

To seed flags for a tenant and environment, run:

```bash
SUPABASE_URL=<url> \
SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
node scripts/seed-flags.js --tenant=<id> --env=<dev|staging|prod>
```

The `scripts/seed-flags.js` script contains an array of flags similar to:

```js
const FLAGS = [
  {
    id: '8e7b21bf-5024-4a0f-80bd-0cb2d040b59e',
    flag: 'beta-dashboard',
    enabled: false,
    rollout_percentage: 0,
    environments: ['development', 'staging'],
  },
];
```

Ensure each flag entry uses `rollout_percentage` instead of the deprecated
`percentage` column name.
