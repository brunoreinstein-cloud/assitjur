import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, Award, Users, TrendingUp, Calendar } from "lucide-react";

export function HeroAbout() {
  const scrollToSection = (id: string) => {
    if (typeof document === "undefined") return;
    
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const stats = [
    { icon: Calendar, value: "20+", label: "Anos de experiência" },
    { icon: Users, value: "50+", label: "Equipes lideradas" },
    { icon: TrendingUp, value: "R$ 2Bi+", label: "Valor gerenciado" },
    { icon: Award, value: "15+", label: "Prêmios recebidos" },
  ];

  return (
    <section className="relative pt-24 pb-16 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,hsl(var(--primary))_0%,transparent_50%)] opacity-10 animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--accent))_0%,transparent_50%)] opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <Badge
                variant="outline"
                className="bg-primary/10 border-primary/30 text-primary px-4 py-2"
              >
                <Award className="h-4 w-4 mr-2" />
                Líder em Inovação Legal
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                AssistJur.IA: o futuro do contencioso jurídico, com
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {" "}
                  inovação e experiência real
                </span>
              </h1>
            </div>

            <p className="text-xl text-muted-foreground leading-relaxed">
              Criado por{" "}
              <strong className="text-foreground">Bianca Reinstein</strong>,
              especialista com mais de 20 anos de atuação em grandes carteiras
              judiciais, transformando a gestão do contencioso através da
              inteligência artificial.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="text-center p-4 rounded-lg bg-gradient-to-br from-background/50 to-muted/20 border border-border/50 hover:border-primary/30 transition-all hover:scale-105 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => scrollToSection("hub-section")}
                className="group px-6 py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                Ver proposta de valor
                <ArrowDown className="ml-2 h-4 w-4 group-hover:translate-y-1 transition-transform" />
              </Button>

              <Button
                variant="outline"
                onClick={() => scrollToSection("bianca-section")}
                className="group"
              >
                Conhecer Bianca
              </Button>
            </div>
          </div>

          {/* Enhanced Profile */}
          <div
            className="relative animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <div className="relative max-w-md mx-auto">
              {/* Background Elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-xl animate-pulse"></div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-accent/30 to-primary/30 rounded-full blur-lg"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-lg"></div>

              {/* Main Profile Card */}
              <div className="relative bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-sm rounded-3xl p-8 border-2 border-primary/20 shadow-glow">
                <div className="text-center space-y-6">
                  {/* Profile Image Container */}
                  <div className="relative">
                    <div className="w-40 h-40 mx-auto bg-gradient-to-br from-primary via-accent to-primary rounded-full p-1 shadow-glow">
                      <div className="w-full h-full bg-gradient-to-br from-background/10 to-background/30 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/20">
                        <span className="text-4xl font-bold bg-gradient-to-br from-primary-foreground to-accent-foreground bg-clip-text text-transparent">
                          BR
                        </span>
                      </div>
                    </div>

                    {/* Floating Badge */}
                    <div className="absolute -bottom-2 -right-2">
                      <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 shadow-lg">
                        <Award className="h-3 w-3 mr-1" />
                        Expert
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">
                      Bianca Reinstein
                    </h3>
                    <p className="text-muted-foreground">
                      Especialista em Contencioso Jurídico
                    </p>
                    <div className="flex justify-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        OAB/SP
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        MBA
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        LLM
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
