import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Activity, Home, LifeBuoy, Search } from "lucide-react";
import { SEO } from "@/seo/SEO";

const NotFound = () => {
  const location = useLocation();
  const [query, setQuery] = useState("");

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/mapa?query=${encodeURIComponent(query)}`;
    }
  };

  return (
    <>
      <SEO title="Página não encontrada" path={location.pathname} noindex />
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-subtle">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle>Página não encontrada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              A página que você procura não existe. Tente buscar novamente ou
              acessar uma das opções abaixo.
            </p>
            <form
              onSubmit={handleSearch}
              role="search"
              aria-label="Buscar conteúdo"
              className="flex gap-2"
            >
              <label htmlFor="search" className="sr-only">
                Buscar
              </label>
              <Input
                id="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                aria-label="Buscar"
                className="flex-1"
              />
              <Button type="submit" aria-label="Buscar">
                <Search className="w-4 h-4 mr-2" /> Buscar
              </Button>
            </form>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button asChild variant="secondary" className="w-full">
                <a href="/" aria-label="Ir para o início">
                  <Home className="w-4 h-4 mr-2" /> Início
                </a>
              </Button>
              <Button asChild variant="secondary" className="w-full">
                <a href="/mapa" aria-label="Ir para o mapa">
                  <Search className="w-4 h-4 mr-2" /> Mapa
                </a>
              </Button>
              <Button asChild variant="secondary" className="w-full">
                <a
                  href="mailto:suporte@assistjur.com"
                  aria-label="Contatar suporte"
                >
                  <LifeBuoy className="w-4 h-4 mr-2" /> Suporte
                </a>
              </Button>
              <Button asChild variant="secondary" className="w-full">
                <a
                  href="https://status.assistjur.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ver status dos serviços"
                >
                  <Activity className="w-4 h-4 mr-2" /> Status
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default NotFound;
