import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Activity,
  AlertTriangle,
  Home,
  LifeBuoy,
  RefreshCw,
  Search,
} from "lucide-react";
import { SEO } from "@/seo/SEO";

interface ServerErrorProps {
  onRetry?: () => void;
}

const ServerError = ({ onRetry }: ServerErrorProps) => {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/mapa?query=${encodeURIComponent(query)}`;
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <>
      <SEO title="Erro interno do servidor" path="/500" noindex />
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-subtle">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Erro interno do servidor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Ocorreu um problema inesperado. Você pode tentar novamente ou usar
              os links abaixo.
            </p>
            <form
              onSubmit={handleSearch}
              role="search"
              aria-label="Buscar conteúdo"
              className="flex gap-2"
            >
              <label htmlFor="error-search" className="sr-only">
                Buscar
              </label>
              <Input
                id="error-search"
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
              <Button
                onClick={handleRetry}
                className="w-full"
                aria-label="Tentar novamente"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente
              </Button>
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

export default ServerError;
