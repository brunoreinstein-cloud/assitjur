-- Fix authentication profile creation issues

-- 1. Fix log_user_action function to handle table_name properly and avoid recursion
CREATE OR REPLACE FUNCTION public.log_user_action(
  action_type text, 
  resource_type text DEFAULT NULL::text, 
  resource_id uuid DEFAULT NULL::uuid, 
  metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile profiles%ROWTYPE;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Only try to get profile if we're not in a profile creation context
  IF action_type NOT LIKE '%PROFILE%' AND current_user_id IS NOT NULL THEN
    SELECT * INTO user_profile
    FROM profiles 
    WHERE user_id = current_user_id;
  END IF;
  
  -- Insert audit log with required table_name field
  INSERT INTO audit_logs (
    user_id, 
    email, 
    role, 
    organization_id, 
    action, 
    resource, 
    table_name,  -- CRITICAL: Set the required table_name field
    result, 
    metadata, 
    ip_address, 
    user_agent
  ) VALUES (
    current_user_id, 
    COALESCE(user_profile.email, 'system'), 
    COALESCE(user_profile.role::text, 'unknown'), 
    user_profile.organization_id,
    action_type, 
    COALESCE(resource_type, 'system'), 
    COALESCE(resource_type, 'system'),  -- Use resource_type for table_name
    'SUCCESS', 
    metadata,
    inet '127.0.0.1', 
    'AssistJur-App'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the main operation
    RAISE NOTICE 'Failed to log user action: %', SQLERRM;
END;
$$;

-- 2. Remove the problematic audit trigger on profiles table that causes recursion
DROP TRIGGER IF EXISTS audit_profiles_operations ON public.profiles;

-- 3. Create a simpler, non-recursive trigger for profile operations
CREATE OR REPLACE FUNCTION public.log_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Direct insert into audit_logs without calling log_user_action to avoid recursion
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    resource,
    result,
    old_values,
    new_values,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'CREATE_PROFILE'
      WHEN TG_OP = 'UPDATE' THEN 'UPDATE_PROFILE'  
      WHEN TG_OP = 'DELETE' THEN 'DELETE_PROFILE'
    END,
    'profiles',
    COALESCE(NEW.id::text, OLD.id::text),
    'profiles',
    'SUCCESS',
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    jsonb_build_object('operation', TG_OP),
    inet '127.0.0.1',
    'AssistJur-System'
  );
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail profile operations due to audit failures
    RAISE NOTICE 'Profile audit failed: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4. Create the new trigger for profile changes
CREATE TRIGGER profile_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_change();

-- 5. Ensure ensureProfile can work by temporarily allowing profile creation
-- Update RLS policy to allow profile creation during signup
CREATE POLICY "Allow profile creation during signup" ON public.profiles
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- 6. Create a function to safely ensure profile exists
CREATE OR REPLACE FUNCTION public.ensure_user_profile(
  user_uuid uuid,
  user_email text,
  user_role user_role DEFAULT 'VIEWER',
  org_id uuid DEFAULT NULL
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record profiles%ROWTYPE;
BEGIN
  -- First try to get existing profile
  SELECT * INTO profile_record
  FROM profiles 
  WHERE user_id = user_uuid;
  
  -- If profile exists, return it
  IF FOUND THEN
    RETURN profile_record;
  END IF;
  
  -- Create new profile without triggering recursion
  INSERT INTO profiles (
    user_id,
    email,
    role,
    organization_id,
    is_active,
    data_access_level
  ) VALUES (
    user_uuid,
    user_email,
    user_role,
    org_id,
    true,
    'NONE'
  )
  RETURNING * INTO profile_record;
  
  RETURN profile_record;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle race condition - get the existing profile
    SELECT * INTO profile_record
    FROM profiles 
    WHERE user_id = user_uuid;
    RETURN profile_record;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to ensure profile: %', SQLERRM;
END;
$$;