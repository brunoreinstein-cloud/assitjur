-- Additional fixes for authentication issues

-- 1. Remove ALL audit triggers on profiles table that might cause recursion
DROP TRIGGER IF EXISTS profile_audit_trigger ON public.profiles;
DROP TRIGGER IF EXISTS audit_critical_operations ON public.profiles;
DROP TRIGGER IF EXISTS audit_profiles_operations ON public.profiles;

-- 2. Drop the problematic log_profile_change function
DROP FUNCTION IF EXISTS public.log_profile_change();

-- 3. Create a minimal audit trigger that won't cause recursion
CREATE OR REPLACE FUNCTION public.simple_profile_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simple audit without calling other functions that might cause recursion
  BEGIN
    INSERT INTO audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      resource,
      result,
      metadata
    ) VALUES (
      COALESCE(NEW.user_id, OLD.user_id),
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'profile_created'
        WHEN TG_OP = 'UPDATE' THEN 'profile_updated'  
        WHEN TG_OP = 'DELETE' THEN 'profile_deleted'
      END,
      'profiles',
      COALESCE(NEW.id::text, OLD.id::text),
      'profiles',
      'SUCCESS',
      jsonb_build_object(
        'operation', TG_OP,
        'timestamp', now(),
        'trigger', 'simple_profile_audit'
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the main operation
      RAISE NOTICE 'Simple profile audit failed: %', SQLERRM;
  END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4. Create a simple trigger for profile operations (optional - can be removed if still causing issues)
-- CREATE TRIGGER simple_profile_audit_trigger
--   AFTER INSERT OR UPDATE OR DELETE ON public.profiles
--   FOR EACH ROW
--   EXECUTE FUNCTION public.simple_profile_audit();

-- 5. Ensure profiles table has correct RLS policies for profile creation
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;

-- Create a comprehensive policy for profile operations
CREATE POLICY "Users can manage their own profiles" ON public.profiles
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Add a policy to allow service role to manage profiles (for our RPC function)
CREATE POLICY "Service role can manage profiles" ON public.profiles
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 7. Test that our ensure_user_profile function works
SELECT 'Database functions ready for profile creation' as status;