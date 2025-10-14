import { useEffect } from "react";

export default function PublicHomeMinimal() {
  useEffect(() => {
    const t0 = typeof performance !== "undefined" ? performance.now() : null;
    const heap = (performance as any)?.memory?.usedJSHeapSize ?? null;
    // Log leve de boot/heap para validação em produção
    // eslint-disable-next-line no-console
    console.log("[Boot] PublicHomeMinimal", {
      t0,
      heapBytes: heap,
    });
  }, []);
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="font-bold">Assistjur.IA</div>
          <a href="/login" className="text-sm underline">Entrar</a>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold">Inteligência jurídica simples e rápida</h1>
        <p className="text-muted-foreground mt-3">Carregamento ultrarrápido. Sem scripts pesados.</p>
        <div className="mt-6">
          <a href="/login" className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground">
            Começar agora
          </a>
        </div>
      </section>
      <footer className="mt-auto border-t">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Assistjur.IA
        </div>
      </footer>
    </main>
  );
}


