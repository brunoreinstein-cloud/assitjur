import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BRAND } from '@/branding/brand';

interface PublicHeaderProps {
  onBetaClick?: () => void;
}

export function PublicHeader({ onBetaClick }: PublicHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    setIsMobileMenuOpen(false);
  };

  type NavItem = {
    label: string;
    action?: () => void;
    children?: { label: string; action: () => void }[];
  };

  const navItems: NavItem[] = [
    { label: 'Início', action: () => scrollToSection('hero') },
    { label: 'Para Quem', action: () => scrollToSection('publico') },
    { label: 'Diferenciais', action: () => scrollToSection('diferenciais') },
    { label: 'ROI', action: () => scrollToSection('roi') },
    { label: 'Agentes', action: () => scrollToSection('agentes') },
    { label: 'Segurança', action: () => scrollToSection('seguranca') },
    {
      label: 'Sobre',
      action: () => scrollToSection('sobre'),
      children: [
        { label: 'O AssistJur.IA', action: () => scrollToSection('sobre') },
        { label: 'Bianca Reinstein', action: () => scrollToSection('bianca') }
      ]
    }
  ];

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-background/95 backdrop-blur-md border-b shadow-sm' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <div className="flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 mr-8" onClick={() => scrollToSection('hero')}>
            <img 
              src={BRAND.logo.light}
              alt={BRAND.name} 
              className="h-14 md:h-16 object-contain filter brightness-0 saturate-100 hue-rotate-258 contrast-125"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-10">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="text-foreground/80 hover:text-primary font-medium text-sm transition-all duration-200 relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
              </button>
            ))}
          </nav>

          {/* Actions + Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Login Button - Hidden on mobile */}
            <Button 
              onClick={() => navigate('/login')}
              variant="outline"
              className="hidden sm:flex border-primary/30 text-primary hover:bg-primary/5 hover:border-primary transition-all duration-200"
            >
              Login
            </Button>
            
            {/* Beta Button */}
            <Button 
              onClick={() => navigate('/beta')}
              className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
            >
              Entrar na Lista Beta
            </Button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-foreground" />
              ) : (
                <Menu className="h-5 w-5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t bg-background/95 backdrop-blur-md shadow-lg">
            <div className="px-6 py-6 space-y-4">
              {/* Mobile Navigation Items */}
              {navItems.map((item, index) => (
                <div key={index}>
                  <button
                    onClick={() => {
                      if (item.children) {
                        setOpenSubmenu(openSubmenu === index ? null : index);
                      } else {
                        item.action?.();
                      }
                    }}
                    className="flex w-full items-center justify-between text-left px-4 py-4 text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-lg transition-all duration-200 font-medium"
                  >
                    {item.label}
                    {item.children && (
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${openSubmenu === index ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>
                  {item.children && openSubmenu === index && (
                    <div className="pl-4">
                      {item.children.map((child, cIndex) => (
                        <button
                          key={cIndex}
                          onClick={() => {
                            child.action();
                            setIsMobileMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-4 text-foreground/70 hover:text-primary hover:bg-muted/50 rounded-lg transition-all duration-200"
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Mobile Action Buttons */}
              <div className="pt-4 space-y-3 border-t border-border/20">
                <Button
                  onClick={() => {
                    navigate('/login');
                    setIsMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="w-full border-primary/30 text-primary hover:bg-primary/5"
                >
                  Login
                </Button>
                <Button
                  onClick={() => {
                    navigate('/beta');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Entrar na Lista Beta
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}