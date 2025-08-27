import React from 'react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const footerLinks = [
    { label: 'Sobre o Hub', href: '#sobre-hub' },
    { label: 'Sobre Bianca', href: '#sobre-bianca' },
    { label: 'Contato', href: '#contato' },
  ];

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Links de navegação */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            {footerLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-background/80 hover:text-background transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          <Separator className="bg-background/20 mb-12" />

          {/* Assinatura institucional */}
          <div className="text-center space-y-6">
            <div className="space-y-3">
              <p className="text-background/90 font-medium">
                Documento produzido com apoio do HubJUR.IA
              </p>
              <p className="text-background/70">
                Gestão do contencioso com inovação e olhar estratégico
              </p>
              <p className="text-background/70">
                por Bianca Reinstein Consultoria
              </p>
            </div>

            <Separator className="bg-background/20 max-w-md mx-auto" />

            {/* Aviso obrigatório */}
            <div className="bg-background/10 rounded-lg p-6 border border-background/20">
              <p className="text-background/90 font-semibold text-sm">
                ⚠️ Aviso Importante
              </p>
              <p className="text-background/80 text-sm mt-2">
                Validação nos autos é obrigatória.
              </p>
            </div>

            {/* Copyright */}
            <div className="pt-8">
              <p className="text-background/60 text-xs">
                © {new Date().getFullYear()} HubJUR.IA. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}