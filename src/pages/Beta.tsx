import React from 'react';
import { BetaHeader } from '@/components/beta/BetaHeader';
import { BetaHero } from '@/components/beta/BetaHero';
import { BetaBenefits } from '@/components/beta/BetaBenefits';
import { BetaSignup } from '@/components/beta/BetaSignup';
import { BetaFAQ } from '@/components/beta/BetaFAQ';
import { Footer } from '@/components/site/Footer';

export default function Beta() {
  return (
    <div className="min-h-screen bg-background">
      
      {/* Header */}
      <BetaHeader />
      
      {/* Hero Section */}
      <BetaHero />
      
      {/* Benefits Section */}
      <BetaBenefits />
      
      {/* Signup Form - Main Conversion Point */}
      <section className="py-20 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Garanta sua vaga agora
              </h2>
              <p className="text-lg text-muted-foreground">
                Processo simples e rápido. Sem compromisso, com suporte dedicado.
              </p>
            </div>
            
            <div className="bg-card border rounded-2xl p-8 shadow-lg">
              <BetaSignup variant="card" />
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <BetaFAQ />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}