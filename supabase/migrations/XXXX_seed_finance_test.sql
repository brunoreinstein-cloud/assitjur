-- Optional seed for manual testing of finance RLS policies.
-- Replace <FINANCE_USER_UUID> with an auth.users.id from your dev environment.
INSERT INTO public.finance_users(user_id) VALUES ('00000000-0000-0000-0000-000000000000')
ON CONFLICT (user_id) DO NOTHING;
