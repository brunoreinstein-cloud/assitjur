import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scale, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GlobalSearch } from "./GlobalSearch";

export const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 0);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 ${
      isSticky ? 'bg-background/80 backdrop-blur-md shadow-md' : 'bg-card'
    } border-b border-border`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 min-w-fit">
          <img 
            src="/lovable-uploads/857f118f-dfc5-4d37-a64d-5f5caf7565f8.png" 
            alt="AssistJur.IA" 
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">AssistJur.IA</h1>
            <p className="text-xs text-muted-foreground">Assistente de Testemunhas</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <GlobalSearch />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 min-w-fit">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/demo')}
            className="hidden md:flex"
          >
            Ver Demo
          </Button>
          
          {user ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/app/chat')}
              className="w-10 h-10 rounded-full"
            >
              <User className="w-5 h-5" />
            </Button>
          ) : (
            <Button 
              variant="professional" 
              onClick={() => navigate('/login')}
            >
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};