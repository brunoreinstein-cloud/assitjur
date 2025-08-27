-- Create beta_signups table for lead capture
CREATE TABLE IF NOT EXISTS public.beta_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cargo TEXT,
  organizacao TEXT NOT NULL,
  necessidades TEXT[] NOT NULL DEFAULT '{}',
  outro_texto TEXT,
  utm JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.beta_signups ENABLE ROW LEVEL SECURITY;

-- Create policies for beta_signups
CREATE POLICY "Beta signups are public for insert" 
ON public.beta_signups 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only admins can view beta signups" 
ON public.beta_signups 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_beta_signups_updated_at
BEFORE UPDATE ON public.beta_signups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for email lookups
CREATE INDEX idx_beta_signups_email ON public.beta_signups (email);
CREATE INDEX idx_beta_signups_created_at ON public.beta_signups (created_at);
CREATE INDEX idx_beta_signups_organizacao ON public.beta_signups (organizacao);