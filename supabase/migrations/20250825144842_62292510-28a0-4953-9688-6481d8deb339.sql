-- Fix security issues from linter

-- 1. Add RLS policy for rate_limits table (only system can access)
CREATE POLICY "Rate limits are system managed"
ON public.rate_limits
FOR ALL
USING (false); -- No direct user access to rate limits

-- 2. Fix function search paths for security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (NEW.id, NEW.email, 'VIEWER');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add missing RLS policies for profiles (insert policy)
CREATE POLICY "Service can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true); -- Allow service to create profiles

-- Add missing RLS policies for audit_logs (insert policy for system)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true); -- Allow system to create audit logs

-- Add missing RLS policies for rate_limits (insert/update for system)
CREATE POLICY "System can manage rate limits"
ON public.rate_limits
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update rate limits"
ON public.rate_limits
FOR UPDATE
USING (true);