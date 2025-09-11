-- Add subscription plan to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';

-- Table to store feature flags per user or plan
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  plan text,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT user_or_plan CHECK ((user_id IS NOT NULL) OR (plan IS NOT NULL))
);

-- Ensure uniqueness for user-level flags
CREATE UNIQUE INDEX IF NOT EXISTS feature_flags_user_flag_idx
  ON public.feature_flags(user_id, flag)
  WHERE user_id IS NOT NULL;

-- Ensure uniqueness for plan-level flags
CREATE UNIQUE INDEX IF NOT EXISTS feature_flags_plan_flag_idx
  ON public.feature_flags(plan, flag)
  WHERE plan IS NOT NULL;
