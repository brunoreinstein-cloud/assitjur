import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Quote, Shield, FileCheck, Globe } from 'lucide-react';

const certifications = [
  { label: 'LGPD', icon: FileCheck },
  { label: 'ISO 27001', icon: Shield },
  { label: 'SOC 2', icon: Globe }
];

export function TrustBlock() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Quote Card */}
          <Card className="mb-12 overflow-hidden border-2 border-primary/20 shadow-glow">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <Quote className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              
              <blockquote className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed mb-6">
                "O HubJUR.IA é a tradução prática de duas décadas de experiência em gestão de contencioso, agora potencializada pela inteligência artificial."
              </blockquote>
              
              <cite className="text-lg text-muted-foreground font-medium">
                — Bianca Reinstein
              </cite>
            </CardContent>
          </Card>

          {/* Certifications */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground mb-6">
              Selos de Credibilidade
            </h3>
            
            <div className="flex flex-wrap justify-center gap-4">
              {certifications.map((cert, index) => {
                const Icon = cert.icon;
                return (
                  <Badge 
                    key={index}
                    variant="outline"
                    className="px-6 py-3 text-base border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 transition-all"
                  >
                    <Icon className="h-5 w-5 mr-2 text-primary" />
                    {cert.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}