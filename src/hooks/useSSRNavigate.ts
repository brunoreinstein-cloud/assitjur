/**
 * SSR-Safe Navigation Hook
 * Hook que funciona tanto no cliente quanto no servidor
 */

import { useNavigate as useNavigateOriginal } from "react-router-dom";
import { isClient } from "@/lib/ssr-safe-utils";

/**
 * Hook de navegação SSR-safe
 * No servidor, retorna uma função no-op
 */
export const useSSRNavigate = () => {
  const navigate = useNavigateOriginal();
  
  if (!isClient) {
    // No servidor, retorna uma função que não faz nada
    return () => {
      console.warn("Navigation attempted on server side - ignoring");
    };
  }
  
  return navigate;
};

/**
 * Hook de navegação com verificação de cliente
 * Útil quando você quer garantir que a navegação só aconteça no cliente
 */
export const useClientNavigate = () => {
  const navigate = useNavigateOriginal();
  
  return (to: string, options?: any) => {
    if (!isClient) {
      console.warn("Client navigation attempted on server side - ignoring");
      return;
    }
    
    navigate(to, options);
  };
};
