"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useConsent } from "@/hooks/useConsent";
import { getEnv } from "@/lib/getEnv";

export function FooterLegal() {
  // ✅ SSR safety: consent is client-only
  if (typeof window === "undefined") {
    return null;
  }

  const { setOpen } = useConsent();
  const handleOpenConsent = () => {
    if (typeof setOpen === "function") {
      setOpen(true);
    }
  };
  const [buildError, setBuildError] = useState(false);
  const linkClasses =
    "text-sm text-foreground hover:text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const { previewTimestamp } = getEnv();

  useEffect(() => {
    fetch("/build-status.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.success) setBuildError(true);
      })
      .catch(() => setBuildError(true));
  }, []);

  return (
    <footer className="bg-muted text-foreground py-4 border-t border-muted-foreground/20">
      <div className="container mx-auto px-6">
        <nav className="flex flex-wrap justify-center gap-6">
          <button onClick={handleOpenConsent} className={linkClasses}>
            Privacidade / Gerenciar cookies
          </button>
          <Link to="/privacidade" className={linkClasses}>
            Política de Privacidade
          </Link>
          <Link to="/termos" className={linkClasses}>
            Termos de Uso
          </Link>
          <Link to="/lgpd" className={linkClasses}>
            LGPD
          </Link>
        </nav>
        {previewTimestamp && (
          <p className="mt-4 text-center text-xs text-foreground/70">
            Preview built at {previewTimestamp}
          </p>
        )}
        {buildError && (
          <p className="mt-4 text-center text-xs text-destructive">
            Build com erro
          </p>
        )}
      </div>
    </footer>
  );
}
