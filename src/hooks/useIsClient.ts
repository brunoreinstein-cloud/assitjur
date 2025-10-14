import { useState, useEffect } from 'react';
import { isClient } from '@/lib/ssr-utils';

/**
 * Hook para detectar se o código está rodando no cliente
 * Útil para componentes que precisam de hidratação
 */
export function useIsClient(): boolean {
  const [client, setClient] = useState(false);

  useEffect(() => {
    setClient(isClient);
  }, []);

  return client;
}

/**
 * Hook para valores que dependem do cliente
 * Retorna o valor do cliente após hidratação, senão o valor do servidor
 */
export function useSSRSafe<T>(clientValue: T, serverValue: T): T {
  const [value, setValue] = useState(serverValue);
  const isClientSide = useIsClient();

  useEffect(() => {
    if (isClientSide) {
      // ✅ GUARDA: Só atualiza se o valor realmente mudou
      setValue(prevValue => {
        if (JSON.stringify(prevValue) === JSON.stringify(clientValue)) return prevValue;
        return clientValue;
      });
    }
  }, [isClientSide, clientValue]);

  return value;
}
