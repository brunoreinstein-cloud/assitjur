import { supabase } from '@/integrations/supabase/client';
import { useSessionStore } from '@/stores/useSessionStore';
import { toast } from '@/hooks/use-toast';
import { logError, logWarn } from '@/lib/logger';

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

  private static isHandling = false;

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
    if (this.isHandling) return;
    this.isHandling = true;

    const {
      redirectToLogin = true,
      showNotification = false,
      preserveCurrentUrl = true
    } = options;

    // Enhanced error logging with structured data
    logWarn('Auth error detected', { 
      error: error.message || error,
      errorCode: error.code,
      errorDescription: error.error_description,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }, 'AuthErrorHandler');

    // Clear all auth-related storage
    await this.clearAuthData();

    if (showNotification) {
      // More specific error messages based on error type
      const title = this.getErrorTitle(error);
      const description = this.getErrorDescription(error);
      
      toast({
        title,
        description,
        variant: "destructive"
      });
    }

    const currentUrl = preserveCurrentUrl ? window.location.pathname : '/';
    const redirectUrl =
      redirectToLogin && currentUrl !== '/login'
        ? `?redirect=${encodeURIComponent(currentUrl)}`
        : '';

    // Reset handling flag after a delay to prevent permanent lock
    setTimeout(() => {
      this.isHandling = false;
    }, 2000);

    useSessionStore.getState().showExpired(`/login${redirectUrl}`);
  }

  private static getErrorTitle(error: any): string {
    if (error.message?.includes('refresh_token')) return 'Sessão Expirada';
    if (error.message?.includes('invalid_token')) return 'Token Inválido';
    if (error.message?.includes('network')) return 'Erro de Conexão';
    return 'Sessão Expirada';
  }

  private static getErrorDescription(error: any): string {
    if (error.message?.includes('refresh_token')) {
      return 'Sua sessão expirou. Faça login novamente para continuar.';
    }
    if (error.message?.includes('invalid_token')) {
      return 'Token de acesso inválido. Redirecionando para login...';
    }
    if (error.message?.includes('network')) {
      return 'Problema de conexão. Verifique sua internet e tente novamente.';
    }
    return 'Por favor, faça login novamente para continuar.';
  }

  static async clearAuthData(): Promise<void> {
    try {
      // Sign out from Supabase (this clears the session)
      await supabase.auth.signOut();
      
      // Clear any residual localStorage items
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('supabase.') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear auth-related sessionStorage keys without touching drafts
      const sessionKeys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('supabase.') || key.includes('auth'))) {
          sessionKeys.push(key);
        }
      }
      sessionKeys.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      logError('Error clearing auth data', { error }, 'AuthErrorHandler');
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
      logError('Session recovery failed', { error }, 'AuthErrorHandler');
      if (this.isAuthError(error)) {
        await this.clearAuthData();
      }
      return false;
    }
  }
}