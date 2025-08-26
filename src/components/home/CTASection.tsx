import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, MessageSquare, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useHomeStore } from '@/lib/store/home';

export const CTASection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setUploadOpen } = useHomeStore();

  const handleStartAnalysis = () => {
    if (user) {
      navigate('/dados/mapa');
    } else {
      navigate('/login');
    }
  };

  const handleStartChat = () => {
    if (user) {
      navigate('/chat');
    } else {
      navigate('/login');
    }
  };

  return (
    <section className="mb-16">
      <Card className="bg-gradient-primary text-primary-foreground border-0 shadow-premium">
        <CardContent className="p-12 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para transformar sua análise de testemunhas?
          </h2>
          
          <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
            Junte-se a centenas de escritórios que já utilizam nossa tecnologia para identificar riscos e otimizar estratégias jurídicas com precisão e eficiência.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              onClick={handleStartAnalysis}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg text-lg px-8 py-4"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Começar Análise Grátis
            </Button>
            
            <Button 
              variant="outline"
              size="lg"
              onClick={handleStartChat}
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm text-lg px-8 py-4"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Conversar com IA
            </Button>
            
            <Button 
              variant="ghost"
              size="lg"
              onClick={() => setUploadOpen(true)}
              className="text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm text-lg px-8 py-4"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Rápido
            </Button>
          </div>
          
          <div className="mt-8 text-sm opacity-75">
            <p>✓ Sem necessidade de cartão de crédito</p>
            <p>✓ Resultados em minutos</p>
            <p>✓ Suporte especializado incluído</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};