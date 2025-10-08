"use client";

import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Mail, Shield } from "lucide-react";

function Footer() {
  // ✅ SSR safety: Return null BEFORE any hooks execution
  if (typeof window === "undefined") {
    return null;
  }

  return <FooterClient />;
}

function FooterClient() {
  // ✅ Lazy load useConsent apenas quando necessário (evento do usuário)
  const handleOpenConsent = () => {
    const { useConsent } = require("@/hooks/useConsent");
    const { setOpen } = useConsent();
    if (typeof setOpen === "function") {
      setOpen(true);
    }
  };

  return (
    <footer className="bg-hero-gradient text-aj-text-high py-16">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Logo e Tagline */}
          <div className="flex justify-center mb-6">
            <BrandLogo size="md" className="h-10 w-auto" />
            <span className="sr-only">AssistJur.IA</span>
          </div>

          <div className="text-center mb-10">
            <p className="text-aj-text-high/90 font-medium text-lg">
              AssistJur.IA — Gestão do contencioso com inovação e olhar
              estratégico, desenvolvido por Bianca Reinstein Consultoria.
            </p>
          </div>

          {/* Links Institucionais */}
          <nav
            className="flex flex-wrap justify-center gap-6 mb-10"
            aria-label="Links institucionais"
          >
            <button
              onClick={handleOpenConsent}
              className="text-sm text-aj-text-high/80 hover:text-aj-text-high transition-colors underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aj-color-gold focus-visible:ring-offset-2"
            >
              Privacidade / Gerenciar cookies
            </button>
            <Link
              to="/privacidade"
              className="text-sm text-aj-text-high/80 hover:text-aj-text-high transition-colors underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aj-color-gold focus-visible:ring-offset-2"
            >
              Política de Privacidade
            </Link>
            <Link
              to="/termos"
              className="text-sm text-aj-text-high/80 hover:text-aj-text-high transition-colors underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aj-color-gold focus-visible:ring-offset-2"
            >
              Termos de Uso
            </Link>
            <Link
              to="/lgpd"
              className="text-sm text-aj-text-high/80 hover:text-aj-text-high transition-colors underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aj-color-gold focus-visible:ring-offset-2"
            >
              LGPD
            </Link>
            <Link
              to="/sobre"
              className="text-sm text-aj-text-high/80 hover:text-aj-text-high transition-colors underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aj-color-gold focus-visible:ring-offset-2"
            >
              Sobre o AssistJur.IA
            </Link>
            <Link
              to="/sobre#seguranca"
              className="text-sm text-aj-text-high/80 hover:text-aj-text-high transition-colors underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aj-color-gold focus-visible:ring-offset-2"
            >
              Segurança & Conformidade
            </Link>
          </nav>

          <Separator className="bg-aj-text-high/20 mb-10" />

          {/* Contato */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-aj-text-high/80 hover:text-aj-text-high transition-colors">
              <Mail className="h-4 w-4" />
              <a
                href="mailto:bianca@brconsultoriaadv.com"
                className="font-medium"
              >
                bianca@brconsultoriaadv.com
              </a>
            </div>
          </div>

          {/* Aviso Legal */}
          <div className="bg-aj-text-high/5 rounded-lg p-6 border border-aj-text-high/10 mb-8">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-aj-color-gold flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-aj-text-high/90 font-semibold text-sm mb-2">
                  Aviso legal:
                </p>
                <p className="text-aj-text-high/70 text-sm leading-relaxed">
                  O AssistJur.IA oferece suporte em inteligência artificial, mas
                  exige sempre a supervisão de um advogado. Não substitui a
                  análise humana, nem dispensa a validação nos autos.
                </p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-aj-text-high/60 text-xs">
              © 2025 AssistJur.IA — Desenvolvido por Bianca Reinstein
              Consultoria. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
