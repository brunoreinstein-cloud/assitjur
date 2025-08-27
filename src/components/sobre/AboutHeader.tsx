import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AboutHeaderProps {
  onOpenBetaModal?: () => void;
}

export function AboutHeader({ onOpenBetaModal }: AboutHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-background/95 backdrop-blur-md border-b' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="text-xl font-bold text-foreground">
              Hub<span className="text-accent">JUR</span><span className="text-primary">.IA</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Início
            </button>
            <button
              onClick={() => navigate('/sobre')}
              className="text-foreground font-medium"
            >
              Sobre
            </button>
            <button
              onClick={() => scrollToSection('seguranca')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Segurança
            </button>
            <button
              onClick={() => scrollToSection('contato')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contato
            </button>
          </nav>

          {/* CTA Button */}
          <Button 
            onClick={() => navigate('/beta')}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground px-6 py-2 shadow-lg"
          >
            Entrar na Lista Beta
          </Button>
        </div>
      </div>
    </header>
  );
}