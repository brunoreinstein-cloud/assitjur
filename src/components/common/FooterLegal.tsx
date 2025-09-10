import React from 'react';
import { Link } from 'react-router-dom';
import { useConsent } from '@/hooks/useConsent';

export function FooterLegal() {
  const { setOpen } = useConsent();
  const linkClasses =
    'text-sm text-foreground hover:text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

  return (
    <footer className="bg-muted text-foreground py-4 border-t border-muted-foreground/20">
      <div className="container mx-auto px-6">
        <nav className="flex flex-wrap justify-center gap-6">
          <button onClick={() => setOpen(true)} className={linkClasses}>
            Privacidade / Gerenciar cookies
          </button>
          <Link to="/politica-de-privacidade" className={linkClasses}>
            Política de Privacidade
          </Link>
          <Link to="/termos-de-uso" className={linkClasses}>
            Termos de Uso
          </Link>
          <Link to="/lgpd" className={linkClasses}>
            LGPD
          </Link>
        </nav>
      </div>
    </footer>
  );
}
