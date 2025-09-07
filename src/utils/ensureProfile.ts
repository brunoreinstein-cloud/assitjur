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
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && profile) {
      if (!profile.organization_id && organizationId) {
        const { data: updated, error: updateError } = await supabase
          .from('profiles')
          .update({ organization_id: organizationId })
          .eq('id', profile.id)
          .select()
          .single();
        if (updateError) {
          console.error('Error updating profile:', updateError);
          return profile;
        }
        return updated as UserProfile;
      }
      return profile as UserProfile;
    }

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        email: user.email ?? '',
        role,
        organization_id: organizationId,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating profile:', insertError);
      return null;
    }

    return newProfile as UserProfile;
  } catch (err) {
    console.error('ensureProfile error:', err);
    return null;
  }
}
