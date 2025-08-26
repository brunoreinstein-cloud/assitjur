import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Quote, Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Dr. Ana Silva',
    role: 'Sócia - Silva & Associados',
    initials: 'AS',
    content: 'O Hubjuria revolucionou nossa análise de riscos. Conseguimos identificar padrões que passariam despercebidos manualmente.',
    rating: 5
  },
  {
    name: 'Dr. Carlos Oliveira',
    role: 'Coordenador Jurídico - TechLaw',
    initials: 'CO',
    content: 'A detecção automática de triangulações nos poupou horas de trabalho e aumentou significativamente nossa precisão.',
    rating: 5
  },
  {
    name: 'Dra. Maria Santos',
    role: 'Diretora - Santos Legal',
    initials: 'MS',
    content: 'Ferramenta essencial para qualquer escritório que trabalha com análise de testemunhas. Interface intuitiva e resultados precisos.',
    rating: 5
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          O que nossos clientes dizem
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Depoimentos de profissionais que já utilizam nossa plataforma para otimizar suas análises jurídicas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="relative border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-6">
              <Quote className="w-8 h-8 text-primary/20 mb-4" />
              
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};