import React from "react";
import { Separator } from "@/components/ui/separator";
import { useConsent } from "@/hooks/useConsent";
import { useNavigate } from "react-router-dom";

export function Footer() {
  const navigate = useNavigate();
  const { setOpen } = useConsent();

  const footerLinks = [
    { label: "Privacidade / Gerenciar cookies", action: () => setOpen(true) },
    { label: "Sobre o AssistJur.IA", action: () => navigate("/sobre") },
    { label: "Sobre Bianca", action: () => navigate("/sobre") },
    {
      label: "Segurança & Conformidade",
      action: () => navigate("/sobre#seguranca"),
    },
  ];

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Texto de rodapé */}
          <div className="text-center mb-8">
            <p className="text-background/90 font-medium text-lg mb-2">
              AssistJur.IA — Gestão do contencioso com inovação e olhar
              estratégico, desenvolvido por Bianca Reinstein Consultoria.
            </p>
          </div>

          {/* Links de navegação */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            {footerLinks.map((link, index) => (
              <button
                key={index}
                onClick={link.action}
                className="text-background/80 hover:text-background transition-colors font-medium underline underline-offset-4"
              >
                {link.label}
              </button>
            ))}
          </div>

          <Separator className="bg-background/20 mb-8" />

          {/* Contato */}
          <div className="text-center mb-8">
            <h3 className="text-background font-semibold mb-2">Contato:</h3>
            <a
              href="mailto:bianca@brconsultoriaadv.com"
              className="text-background/80 hover:text-background transition-colors"
            >
              📩 bianca@brconsultoriaadv.com
            </a>
          </div>

          <Separator className="bg-background/20 mb-8" />

          {/* Aviso Legal */}
          <div className="bg-background/10 rounded-lg p-6 border border-background/20 mb-6">
            <p className="text-background/90 font-semibold text-sm mb-2">
              ⚠️ Aviso legal:
            </p>
            <p className="text-background/80 text-sm">
              O AssistJur.IA oferece suporte em inteligência artificial, mas
              exige sempre a supervisão de um advogado. Não substitui a análise
              humana, nem dispensa a validação nos autos.
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-background/70 text-sm">
              © 2025 AssistJur.IA. Desenvolvido por Bianca Reinstein
              Consultoria. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
