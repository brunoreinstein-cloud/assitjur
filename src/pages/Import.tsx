import { AssistJurUploadWizard } from "@/components/assistjur/AssistJurUploadWizard";

const Import = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Importador AssistJur.IA
          </h1>
          <p className="mt-2 text-muted-foreground">
            Pipeline completo de análise de testemunhas e processos com detecção
            de padrões
          </p>
        </div>
        <AssistJurUploadWizard />
      </div>
    </div>
  );
};

export default Import;
