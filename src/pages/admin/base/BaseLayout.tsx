import { Outlet, Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Scale, Users, Database, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BaseLayout() {
  const location = useLocation();
  const currentTab = location.pathname.includes('/testemunhas') ? 'testemunhas' : 'processos';

  return (
    <div className="flex flex-col h-full bg-gradient-subtle">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="flex items-center justify-between p-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              Explorar Dados
            </h1>
            <p className="text-sm text-muted-foreground">
              Revise, valide e gerencie dados pós-importação com controle de qualidade
            </p>
          </div>
          
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Exportar
          </Button>
        </div>

        {/* Tabs Navigation */}
        <div className="px-6">
          <Tabs value={currentTab} className="w-auto">
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="processos" asChild>
                <Link to="/admin/base/processos" className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  <span className="hidden sm:inline">Processos</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="testemunhas" asChild>
                <Link to="/admin/base/testemunhas" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Testemunhas</span>
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}