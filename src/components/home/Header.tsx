import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GlobalSearch } from "@/components/home/GlobalSearch";
import { LastUpdateBadge } from "@/components/ui/LastUpdateBadge";
import { BrandLogo } from "@/components/brand/BrandLogo";

export const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleScroll = () => {
      setIsSticky(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isSticky ? "bg-background/80 backdrop-blur-md shadow-md" : "bg-card"
      } border-b border-border`}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 min-w-fit cursor-pointer transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <BrandLogo size="lg" className="h-10 md:h-12" />
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <GlobalSearch />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 min-w-fit">
          {user && <LastUpdateBadge />}

          <Button
            variant="ghost"
            onClick={() => navigate("/demo")}
            className="hidden md:flex"
          >
            Ver Demo
          </Button>

          {user ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/app/chat")}
              className="w-10 h-10 rounded-full"
              aria-label="Abrir área do usuário"
            >
              <User className="w-5 h-5" aria-hidden="true" />
            </Button>
          ) : (
            <Button variant="professional" onClick={() => navigate("/login")}>
              Acessar área segura
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
