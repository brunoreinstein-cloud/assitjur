import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, ArrowRight, ExternalLink } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  linkTo: string;
  exampleLink?: string;
}

export const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  linkTo,
  exampleLink 
}: FeatureCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 bg-gradient-card">
      <CardHeader className="pb-4">
        <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:shadow-lg transition-shadow">
          <Icon className="w-6 h-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={() => navigate(linkTo)}
            className="flex-1 group/btn"
            variant="professional"
          >
            Abrir
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-0.5 transition-transform" />
          </Button>
          
          {exampleLink && (
            <Button 
              variant="outline"
              onClick={() => navigate(exampleLink)}
              className="flex-1"
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