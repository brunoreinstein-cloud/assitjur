import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole, UserProfile } from '@/hooks/useAuth';

/**
 * Ensures a profile exists for the given user. If none exists, it will be
 * created. Optionally associates the profile with an organization.
 */
export async function ensureProfile(
  user: User,
  role: UserRole = 'VIEWER',
  organizationId?: string
): Promise<UserProfile | null> {
  try {
    // First try to get existing profile with better error handling
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid coercion errors

    if (error) {
      console.error('Error fetching profile:', error);
      // Continue to create new profile if fetch fails
    }

    if (profile) {
      // Update organization if needed and not set
      if (!profile.organization_id && organizationId) {
        const { data: updated, error: updateError } = await supabase
          .from('profiles')
          .update({ organization_id: organizationId })
          .eq('id', profile.id)
          .select()
          .maybeSingle();
        
        if (updateError) {
          console.error('Error updating profile:', updateError);
          return profile; // Return original profile if update fails
        }
        return updated as UserProfile;
      }
      return profile as UserProfile;
    }

    // Create new profile if none exists
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        email: user.email ?? '',
        role,
        organization_id: organizationId,
        is_active: true,
        data_access_level: 'NONE'
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('Error creating profile:', insertError);
      
      // If profile already exists (race condition), try to fetch it again
      if (insertError.code === '23505') { // Unique constraint violation
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        return existingProfile as UserProfile;
      }
      
      return null;
    }

    return newProfile as UserProfile;
  } catch (err) {
    console.error('ensureProfile error:', err);
    return null;
  }
}
