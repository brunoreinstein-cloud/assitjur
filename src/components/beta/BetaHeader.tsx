import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function BetaHeader() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            aria-label="Página inicial"
            className="flex items-center space-x-3 cursor-pointer transition-transform duration-200 hover:scale-105"
          >
            <BrandLogo size="lg" className="h-10 md:h-12" />
          </Link>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft
                className="w-4 h-4"
                aria-hidden="true"
                focusable="false"
              />
              <span>Voltar</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
