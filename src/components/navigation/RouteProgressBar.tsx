import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteProgressBar() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, [location]);

  return (
    <div
      aria-busy={loading}
      className={`fixed top-0 left-0 right-0 h-1 bg-primary transition-all duration-300 z-50 ${
        loading ? 'w-full opacity-100' : 'w-0 opacity-0'
      }`}
    >
      {loading && <span className="sr-only">Carregando dados jurídicos…</span>}
    </div>
  );
}
