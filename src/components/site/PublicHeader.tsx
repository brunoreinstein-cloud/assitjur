import React, { useState, useCallback } from 'react';
import { track } from '@/lib/track';

interface PublicHeaderProps {
  onBetaClick?: () => void;
}

export function PublicHeader({ onBetaClick }: PublicHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMobileMenuOpen(false);
  }, []);

  const handleNavClick = useCallback(
    (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      scrollToSection(id);
    },
    [scrollToSection]
  );

  const handleBetaClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (onBetaClick) {
        e.preventDefault();
        track('cta_click', { id: 'menu-entrar-beta' });
        onBetaClick();
      }
    },
    [onBetaClick]
  );

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const navItems = [
    { label: 'Início', id: 'inicio' },
    { label: 'Para Quem', id: 'para-quem' },
    { label: 'Diferenciais', id: 'diferenciais' },
    { label: 'ROI', id: 'roi' },
    { label: 'Agentes', id: 'agentes' },
    { label: 'Segurança', id: 'seguranca' },
    { label: 'Sobre', id: 'sobre' }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#1e0033]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1e0033]/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <img
              src="/logos/assistjur-logo-leaf.png"
              alt="AssistJur.IA"
              className="h-8 w-auto"
              loading="lazy"
              decoding="async"
              width="133"
              height="40"
            />
            <span className="sr-only">AssistJur.IA</span>
          </a>

          {/* Desktop Links */}
          <ul className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-200">
            {navItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={handleNavClick(item.id)}
                  className="hover:text-white hover:underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-[#1e0033]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/login"
              className="px-4 py-2 rounded-md border border-purple-500 text-purple-300 hover:bg-purple-600 hover:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-[#1e0033]"
            >
              Login
            </a>
            <a
              href="#lista-beta"
              onClick={handleBetaClick}
              className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 focus:ring-offset-[#1e0033]"
            >
              Entrar na Lista Beta
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            aria-label="Abrir menu"
            aria-controls="menu"
            aria-expanded={isMobileMenuOpen}
            onClick={toggleMobileMenu}
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-200 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-[#1e0033]"
          >
            {isMobileMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div id="menu" className="md:hidden border-t border-white/10">
            <ul className="flex flex-col gap-4 px-4 py-6 text-gray-200">
              {navItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={handleNavClick(item.id)}
                    className="block py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-[#1e0033] hover:text-white hover:underline underline-offset-4"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li className="pt-2 flex flex-col gap-3">
                <a
                  href="/login"
                  className="px-4 py-2 rounded-md border border-purple-500 text-purple-300 hover:bg-purple-600 hover:text-gray-50 text-center focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-[#1e0033]"
                >
                  Login
                </a>
                <a
                  href="#lista-beta"
                  onClick={handleBetaClick}
                  className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold shadow-md hover:opacity-90 text-center focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 focus:ring-offset-[#1e0033]"
                >
                  Entrar na Lista Beta
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}

export default PublicHeader;
