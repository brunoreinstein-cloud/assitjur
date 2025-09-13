import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ExternalLink } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  linkTo: string;
  exampleLink?: string;
  highlight?: boolean;
}

export const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  linkTo,
  exampleLink,
  highlight = false
}: FeatureCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 ${
      highlight ? 'bg-gradient-primary text-primary-foreground shadow-premium' : 'bg-gradient-card'
    }`}>
      <CardHeader className="pb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:shadow-lg transition-shadow ${
          highlight ? 'bg-primary-foreground/20' : 'bg-gradient-primary'
        }`}>
          <Icon className={`w-6 h-6 ${
            highlight ? 'text-primary-foreground' : 'text-primary-foreground'
          }`} />
        </div>
        <CardTitle className={`text-xl font-semibold group-hover:text-primary transition-colors ${
          highlight ? 'text-primary-foreground' : 'text-foreground'
        }`}>
          {title}
        </CardTitle>
        <CardDescription className={`leading-relaxed ${
          highlight ? 'text-primary-foreground/90' : 'text-muted-foreground'
        }`}>
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={() => navigate(linkTo)}
            className="flex-1 group/btn"
            variant={highlight ? "secondary" : "default"}
          >
            Abrir
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-0.5 transition-transform" />
          </Button>
          
          {exampleLink && (
            <Button 
              variant="outline"
              onClick={() => navigate(exampleLink)}
              className={`flex-1 ${
                highlight ? 'border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10' : ''
              }`}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver exemplo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};