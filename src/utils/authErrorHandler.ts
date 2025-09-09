import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AuthErrorHandlerOptions {
  redirectToLogin?: boolean;
  showNotification?: boolean;
  preserveCurrentUrl?: boolean;
}

export class AuthErrorHandler {
  private static readonly AUTH_ERROR_TYPES = [
    'Invalid Refresh Token',
    'refresh_token_not_found', 
    'invalid_token',
    'jwt_invalid',
    'token_expired'
  ];

  static isAuthError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message || error.error_description || error.error || '';
    return this.AUTH_ERROR_TYPES.some(type => 
      message.toLowerCase().includes(type.toLowerCase())
    );
  }

  static async handleAuthError(
    error: any, 
    options: AuthErrorHandlerOptions = {}
  ): Promise<void> {
    const {
      redirectToLogin = true,
      showNotification = true,
      preserveCurrentUrl = true
    } = options;

    console.warn('Auth error detected:', error);

    // Clear all auth-related storage
    await this.clearAuthData();

    if (showNotification) {
      toast({
        title: "Sessão Expirada",
        description: "Por favor, faça login novamente para continuar.",
        variant: "destructive"
      });
    }

    if (redirectToLogin) {
      const currentUrl = preserveCurrentUrl ? window.location.pathname : '/';
      const redirectUrl = currentUrl !== '/login' ? `?redirect=${encodeURIComponent(currentUrl)}` : '';
      
      // Small delay to allow toast to show
      setTimeout(() => {
        window.location.href = `/login${redirectUrl}`;
      }, 500);
    }
  }

  static async clearAuthData(): Promise<void> {
    try {
      // Sign out from Supabase (this clears the session)
      await supabase.auth.signOut();
      
      // Clear any residual localStorage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('supabase.') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage as well
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  static async tryRecoverSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        if (this.isAuthError(error)) {
          await this.clearAuthData();
          return false;
        }
        throw error;
      }

      if (!session) {
        return false;
      }

      // Try to refresh the session if it exists
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        if (this.isAuthError(refreshError)) {
          await this.clearAuthData();
          return false;
        }
        throw refreshError;
      }

      return true;
    } catch (error) {
      console.error('Session recovery failed:', error);
      if (this.isAuthError(error)) {
        await this.clearAuthData();
      }
      return false;
    }
  }
}