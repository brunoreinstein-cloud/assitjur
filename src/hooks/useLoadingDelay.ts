import { useEffect, useState } from 'react';

/**
 * Ensures loading indicators remain visible for at least `delay` ms.
 * Useful to prevent flicker when data loads too quickly.
 */
export function useLoadingDelay(isLoading: boolean, delay = 300) {
  const [show, setShow] = useState(isLoading);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (isLoading) {
      setShow(true);
    } else {
      timeout = setTimeout(() => setShow(false), delay);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoading, delay]);

  return show;
}
