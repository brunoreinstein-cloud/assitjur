/**
 * Debug Mode Manager
 * Gerencia o estado de debug mode da aplicação usando localStorage
 */

const DEBUG_MODE_KEY = "assistjur_debug_mode";

export const DebugMode = {
  /**
   * Verifica se o modo debug está ativo
   */
  isEnabled(): boolean {
    if (typeof window === "undefined") return false;
    return typeof localStorage !== "undefined" && localStorage.getItem(DEBUG_MODE_KEY) === "true";
  },

  /**
   * Ativa o modo debug
   */
  enable(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return;
    localStorage.setItem(DEBUG_MODE_KEY, "true");
    console.log("🐛 Debug mode ATIVADO");
  },

  /**
   * Desativa o modo debug
   */
  disable(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return;
    localStorage.setItem(DEBUG_MODE_KEY, "false");
    console.log("🐛 Debug mode DESATIVADO");
  },

  /**
   * Alterna o estado do modo debug
   */
  toggle(): boolean {
    const newState = !this.isEnabled();
    if (newState) {
      this.enable();
    } else {
      this.disable();
    }
    return newState;
  },

  /**
   * Log condicional baseado no modo debug
   */
  log(message: string, ...args: unknown[]): void {
    if (this.isEnabled()) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Warn condicional baseado no modo debug
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.isEnabled()) {
      console.warn(`[DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Error sempre é exibido, mas com marcação especial em debug mode
   */
  error(message: string, ...args: unknown[]): void {
    if (this.isEnabled()) {
      console.error(`[DEBUG] ${message}`, ...args);
    } else {
      console.error(message, ...args);
    }
  },
};
