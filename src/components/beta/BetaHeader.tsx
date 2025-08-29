import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BetaHeader() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/857f118f-dfc5-4d37-a64d-5f5caf7565f8.png" 
              alt="AssistJur.IA" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold">
              Assist<span className="text-accent">Jur</span><span className="text-primary">.IA</span>
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}