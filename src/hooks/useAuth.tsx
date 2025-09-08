import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ensureProfile } from '@/utils/ensureProfile';

export type UserRole = 'ADMIN' | 'ANALYST' | 'VIEWER';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  role: UserRole;
  organization_id?: string;
  is_active: boolean;
  terms_accepted_at?: string | null;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  data_access_level: 'FULL' | 'MASKED' | 'NONE';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, role: 'OFFICE' | 'ADMIN', orgCode?: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name?: string, orgCode?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const logAuthAttempt = async (email: string, action: string, result: string, metadata?: any) => {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          email,
          action,
          result,
          ip_address: null, // Would need server-side implementation for real IP
          user_agent: navigator.userAgent,
          metadata: metadata || {}
        });

      if (error) {
        console.error('Error logging auth attempt:', error);
      }
    } catch (error) {
      console.error('Error logging auth attempt:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetching to avoid recursion
          setTimeout(async () => {
            let profileData = await fetchProfile(session.user.id);
            if (!profileData) {
              profileData = (await ensureProfile(session.user)) as any;
            }
            setProfile(profileData as UserProfile);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          let profileData = await fetchProfile(session.user.id);
          if (!profileData) {
            profileData = (await ensureProfile(session.user)) as any;
          }
          setProfile(profileData as UserProfile);
          setLoading(false);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, role: 'OFFICE' | 'ADMIN', orgCode?: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await logAuthAttempt(email, 'login', 'failure', { role, error: error.message });

        if (error.message.includes('Invalid login credentials')) {
          return { error: { message: 'E-mail ou senha incorretos.' } };
        }
        return { error };
      }

      if (data.user) {
        let orgId: string | undefined;
        if (role === 'ADMIN' && orgCode) {
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('id')
            .eq('code', orgCode)
            .single();

          if (orgError || !orgData) {
            await logAuthAttempt(email, 'login', 'failure', { role, orgCode, error: 'Invalid org code' });
            return { error: { message: 'Código da organização não encontrado.' } };
          }
          orgId = orgData.id;
        }

        const profileData = await ensureProfile(
          data.user,
          role === 'ADMIN' ? 'ADMIN' : 'ANALYST',
          orgId
        );

        if (!profileData) {
          await logAuthAttempt(email, 'login', 'failure', { role, error: 'Profile not found' });
          return { error: { message: 'Perfil de usuário não encontrado.' } };
        }

        if (!profileData.is_active) {
          await logAuthAttempt(email, 'login', 'failure', { role, error: 'Account deactivated' });
          return { error: { message: 'Sua conta está desativada. Contate o Administrador.' } };
        }

        if (role === 'ADMIN' && profileData.role !== 'ADMIN') {
          await logAuthAttempt(email, 'login', 'failure', { role, error: 'Insufficient privileges' });
          return { error: { message: 'Sua conta não possui o perfil Administrador. Tente "Entrar como Escritório" ou contate o responsável.' } };
        }

        await logAuthAttempt(email, 'login', 'success', { role, user_role: profileData.role });
        setProfile(profileData);
      }

      return { error: null };
    } catch (error: any) {
      await logAuthAttempt(email, 'login', 'failure', { role, error: error.message });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string, orgCode?: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name },
        },
      });

      if (error) {
        await logAuthAttempt(email, 'signup', 'failure', { error: error.message });
        return { error };
      }

      let orgId: string | undefined;
      if (orgCode) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id')
          .eq('code', orgCode)
          .single();
        orgId = orgData?.id;
      }

      if (data.user) {
        await ensureProfile(data.user, 'VIEWER', orgId);
      }

      await logAuthAttempt(email, 'signup', 'success', {});
      return { error: null };
    } catch (error: any) {
      await logAuthAttempt(email, 'signup', 'failure', { error: error.message });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return profile?.role === role;
  };

  const isAdmin = profile?.role === 'ADMIN';

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    hasRole,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};