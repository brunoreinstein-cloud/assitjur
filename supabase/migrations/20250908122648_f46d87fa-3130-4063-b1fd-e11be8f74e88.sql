-- Enable RLS on public tables that don't have it
ALTER TABLE public.example ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;

-- Add policies for example table (deny all access)
CREATE POLICY "Deny all access to example table" 
ON public.example 
FOR ALL 
USING (false);

-- Add policies for rate limit tables (system access only)
CREATE POLICY "Service role can manage rate limit counters" 
ON public.rate_limit_counters 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage rate limit hits" 
ON public.rate_limit_hits 
FOR ALL 
USING (auth.role() = 'service_role');

-- Add missing UPDATE and DELETE policies for beta_signups (admin only)
CREATE POLICY "Only admins can update beta signups" 
ON public.beta_signups 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role = 'ADMIN'
));

CREATE POLICY "Only admins can delete beta signups" 
ON public.beta_signups 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role = 'ADMIN'
));

-- Improve rate limiting with trigger for beta signups
CREATE OR REPLACE FUNCTION public.check_beta_signup_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this email has signed up recently (within 24 hours)
  IF EXISTS (
    SELECT 1 FROM beta_signups 
    WHERE email = NEW.email 
    AND created_at > now() - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded: Email already signed up recently';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for beta signup rate limiting
DROP TRIGGER IF EXISTS beta_signup_rate_limit_trigger ON public.beta_signups;
CREATE TRIGGER beta_signup_rate_limit_trigger
  BEFORE INSERT ON public.beta_signups
  FOR EACH ROW
  EXECUTE FUNCTION public.check_beta_signup_rate_limit();