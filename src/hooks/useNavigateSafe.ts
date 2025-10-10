import { useNavigate as useReactRouterNavigate } from 'react-router-dom';
import { isClient } from '@/lib/ssr-utils';

/**
 * Hook seguro para navegação que funciona tanto no cliente quanto no servidor
 * No servidor, retorna uma função no-op
 */
export function useNavigateSafe() {
  const navigate = useReactRouterNavigate();

  return (to: string | number, options?: { replace?: boolean; state?: any }) => {
    if (!isClient) {
      // No-op no servidor
      return;
    }

    if (typeof to === 'string') {
      navigate(to, options);
    } else {
      navigate(to);
    }
  };
}
