-- Fix critical infinite recursion in profiles RLS policies
-- This is causing the "infinite recursion detected in policy for relation profiles" error

-- First, drop all existing problematic policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "users_can_view_own_profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Service role needs to insert profiles during signup
CREATE POLICY "service_role_can_insert_profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Admin users can view profiles in their organization using a security definer function
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS public.profiles
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.* FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin_simple(check_org_id uuid)
RETURNS boolean
LANGUAGE SQL  
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = check_org_id 
    AND p.role = 'ADMIN'
    AND p.is_active = true
  );
$$;

-- Allow admins to view profiles in their organization (non-recursive)
CREATE POLICY "admins_can_view_org_profiles" 
ON public.profiles 
FOR SELECT 
USING (
  organization_id IS NOT NULL 
  AND public.is_org_admin_simple(organization_id)
);

-- Add basic RLS policies for tables that are missing them
-- These were identified by the linter as having RLS enabled but no policies

-- Conversations table policies (basic org isolation)
CREATE POLICY "users_can_access_org_conversations" 
ON public.conversations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = conversations.org_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = conversations.org_id
  )
);

-- Messages table policies  
CREATE POLICY "users_can_access_org_messages" 
ON public.messages 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN profiles p ON p.organization_id = c.org_id
    WHERE c.id = messages.conversation_id 
    AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN profiles p ON p.organization_id = c.org_id
    WHERE c.id = messages.conversation_id 
    AND p.user_id = auth.uid()
  )
);

-- Legal cases table policies
CREATE POLICY "users_can_access_org_legal_cases" 
ON public.legal_cases 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = legal_cases.org_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = legal_cases.org_id
  )
);

-- Rate limits enhanced table policies
CREATE POLICY "users_can_manage_own_rate_limits" 
ON public.rate_limits_enhanced 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Retention policies table policies
CREATE POLICY "users_can_access_org_retention_policies" 
ON public.retention_policies 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = retention_policies.org_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = retention_policies.org_id
  )
);

-- Subscriptions table policies
CREATE POLICY "users_can_access_org_subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = subscriptions.org_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = subscriptions.org_id
  )
);

-- User invitations table policies
CREATE POLICY "users_can_access_org_invitations" 
ON public.user_invitations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = user_invitations.org_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = user_invitations.org_id
  )
);