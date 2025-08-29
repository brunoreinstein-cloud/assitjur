import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqItems = [
  {
    question: 'O que é o programa Beta do AssistJur.IA?',
    answer: 'O programa Beta oferece acesso antecipado e gratuito ao AssistJur.IA para um grupo seleto de profissionais jurídicos. Você poderá testar todas as funcionalidades, dar feedback e ajudar a moldar o produto final antes do lançamento oficial.'
  },
  {
    question: 'Quanto custa participar do programa Beta?',
    answer: 'A participação no programa Beta é completamente gratuita. Não há taxas, mensalidades ou compromissos financeiros. É nossa forma de agradecer pelo seu tempo e feedback valioso.'
  },
  {
    question: 'Por quanto tempo terei acesso ao programa Beta?',
    answer: 'O programa Beta terá duração de 3 a 6 meses, dependendo do feedback recebido e das melhorias implementadas. Todos os participantes serão migrados automaticamente para a versão premium com desconto especial.'
  },
  {
    question: 'Quantas vagas estão disponíveis?',
    answer: 'Limitamos o programa a 100 participantes para garantir suporte personalizado e feedback de qualidade. As vagas são preenchidas por ordem de inscrição e adequação ao perfil do programa.'
  },
  {
    question: 'Que tipo de suporte receberei?',
    answer: 'Todos os beta testers têm acesso a suporte premium via email, WhatsApp e videochamadas semanais com a equipe de desenvolvimento. Também participará de um grupo exclusivo no Slack para trocas com outros participantes.'
  },
  {
    question: 'Meus dados estarão seguros durante o Beta?',
    answer: 'Sim, seguimos os mais rigorosos padrões de segurança e somos totalmente conformes com a LGPD. Todos os dados são criptografados e processados em ambiente seguro. Você pode excluir seus dados a qualquer momento.'
  },
  {
    question: 'Posso cancelar minha participação a qualquer momento?',
    answer: 'Claro! Você pode sair do programa Beta a qualquer momento, sem penalidades ou questionamentos. Basta enviar um email ou usar a opção de cancelamento na plataforma.'
  },
  {
    question: 'Como será a transição para a versão paga?',
    answer: 'Ao final do programa Beta, você receberá um desconto especial de 50% na assinatura anual da versão premium. A migração é opcional e todos os seus dados e configurações são mantidos.'
  }
];

export function BetaFAQ() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-muted/50 border rounded-full mb-6">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Perguntas frequentes</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ainda tem dúvidas?
            </h2>
            <p className="text-lg text-muted-foreground">
              Aqui estão as respostas para as perguntas mais comuns sobre o programa Beta.
            </p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border rounded-lg px-6 bg-card hover:bg-muted/30 transition-colors"
              >
                <AccordionTrigger className="text-left font-medium text-foreground py-6 hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="mt-12 p-6 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ainda tem dúvidas?
            </h3>
            <p className="text-muted-foreground mb-4">
              Entre em contato conosco pelo email <strong>contato@assistjur.ia</strong> ou 
              WhatsApp <strong>(11) 99999-9999</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Resposta garantida em até 2 horas durante horário comercial.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}