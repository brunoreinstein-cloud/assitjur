import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ensureProfile } from '@/utils/ensureProfile';
import { AuthErrorHandler } from '@/utils/authErrorHandler';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';
import { getSessionContext, calculateRisk } from '@/security/sessionContext';
import { getEnv } from '@/lib/getEnv';
import { logError, logWarn } from '@/lib/logger';

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
  two_factor_enabled?: boolean;
  two_factor_secret?: string | null;
  two_factor_backup_code?: string | null;
  plan?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  /**
   * Realiza login por e-mail e senha.
   * @param email E-mail do usuário
   * @param password Senha do usuário
   * @param role Perfil de acesso solicitado
   * @param rememberMe Define se a sessão deve ser persistida entre reinícios do navegador
   * @param orgCode Código da organização (apenas para administradores)
   */
  signIn: (
    email: string,
    password: string,
    role: 'OFFICE' | 'ADMIN',
    rememberMe?: boolean,
    orgCode?: string
  ) => Promise<{ error: any }>;
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

  // Enable session monitoring for authenticated users
  const { inactivityTimeoutMinutes: inactivity } = getEnv();
  useSessionMonitor({
    enabled: !!session,
    checkInterval: 5, // Check every 5 minutes
    preemptiveRefresh: 10, // Refresh 10 minutes before expiry
    inactivityTimeout: inactivity
  });

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        logError('Error fetching profile', { error: error.message || error }, 'useAuth');
        return null;
      }
      
      return data;
    } catch (error) {
      logError('Error fetching profile in catch', { error }, 'useAuth');
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
        logError('Error logging auth attempt', { error: error.message || error }, 'useAuth');
      }
    } catch (error) {
      logError('Error logging auth attempt in catch', { error }, 'useAuth');
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
            try {
              let profileData = await fetchProfile(session.user.id);
              if (!profileData) {
                profileData = (await ensureProfile(session.user)) as any;
              }
              setProfile(profileData as UserProfile);
              setLoading(false);
            } catch (error) {
              if (AuthErrorHandler.isAuthError(error)) {
                await AuthErrorHandler.handleAuthError(error, { 
                  showNotification: false // Avoid notification spam on initial load
                });
              } else {
                logError('Profile fetch error', { error }, 'useAuth');
              }
              setLoading(false);
            }
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session with enhanced error handling
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (AuthErrorHandler.isAuthError(error)) {
            await AuthErrorHandler.handleAuthError(error, { 
              showNotification: false 
            });
            return;
          }
          throw error;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            try {
              let profileData = await fetchProfile(session.user.id);
              if (!profileData) {
                profileData = (await ensureProfile(session.user)) as any;
              }
              setProfile(profileData as UserProfile);
              setLoading(false);
            } catch (error) {
              if (AuthErrorHandler.isAuthError(error)) {
                await AuthErrorHandler.handleAuthError(error, { 
                  showNotification: false
                });
              } else {
                logError('Profile fetch error in session init', { error }, 'useAuth');
              }
              setLoading(false);
            }
          }, 0);
        } else {
          setLoading(false);
        }
      } catch (error) {
        logError('Session initialization error', { error }, 'useAuth');
        setLoading(false);
      }
    };

    initializeSession();

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Realiza login e ajusta a persistência da sessão conforme "rememberMe".
   */
  const signIn = async (
    email: string,
    password: string,
    role: 'OFFICE' | 'ADMIN',
    rememberMe = true,
    orgCode?: string
  ) => {
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

        if (error.message.includes('Email not confirmed')) {
          return { error: { message: 'E-mail não confirmado. Verifique sua caixa de entrada.' } };
        }

        return { error };
      }

      if (data.user) {
        // Rotate refresh token on login
        const { data: refreshed } = await supabase.auth.refreshSession();

        // Ajusta a persistência da sessão conforme a opção "Lembrar-me"
        const sessionToPersist = refreshed.session ?? data.session;
        if (sessionToPersist) {
          await supabase.auth.setSession({
            access_token: sessionToPersist.access_token,
            refresh_token: sessionToPersist.refresh_token,
          });
        }

        // Collect session context and previous timezone
        const ctx = getSessionContext();
        let previousTz: string | null = null;
        // TODO: Re-enable when sessions table exists
        // try {
        //   const { data: last } = await supabase
        //     .from('sessions')
        //     .select('device_label')
        //     .eq('user_id', data.user.id)
        //     .order('last_seen', { ascending: false })
        //     .limit(1)
        //     .single();
        //   if (last?.device_label) {
        //     const parts = last.device_label.split('|');
        //     previousTz = parts[2]?.trim() || null;
        //   }
        // } catch {}
        const risk = 0; // TODO: Re-implement calculateRisk when sessions table exists
        // TODO: Re-enable when sessions table exists
        // await supabase
        //   .from('sessions')
        //   .upsert({
        //     user_id: data.user.id,
        //     device_label: `${ctx.platform} | ${ctx.language} | ${ctx.timezone}`,
        //     last_ip: null,
        //     last_seen: new Date().toISOString(),
        //     risk_score: risk,
        //   } as any);

        if (risk >= 70) {
          // Log anomaly in audit log
          await supabase.from('audit_logs').insert({
            email,
            action: 'SESSION_ANOMALY',
            result: 'HIGH_RISK',
            ip_address: null,
            user_agent: ctx.userAgent,
            metadata: { context: ctx, risk },
          } as any);
          logWarn('High risk session detected; step-up authentication required', { risk, user_id: data.user.id }, 'useAuth');
        }

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
      // Redirect users back to the login page with a confirmation flag
      // so the UI can display the proper message after e-mail verification.
      const redirectUrl = `${window.location.origin}/login?confirm=1`;

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
        if (error.message.includes('User already registered')) {
          return { error: { message: 'E-mail já cadastrado. Faça login.' } };
        }
        return { error };
      }

      let orgId: string | undefined;
      if (orgCode) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('code', orgCode)
          .single();

        if (orgError || !orgData) {
          await logAuthAttempt(email, 'signup', 'failure', { orgCode, error: 'Invalid org code' });
          return { error: { message: 'Código da organização não encontrado.' } };
        }
        orgId = orgData.id;
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
      sessionStorage.removeItem('mfa_verified');
    } catch (error) {
      logError('Error signing out', { error }, 'useAuth');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { siteUrl } = getEnv();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/reset-password`
      });
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