import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export const AuthCard = ({ title, description, children }: AuthCardProps) => {
  return (
    <Card className="w-full max-w-md shadow-premium rounded-2xl">
      <CardHeader className="text-center space-y-4 pb-6">
        <div className="mx-auto p-4 bg-gradient-primary rounded-2xl w-fit shadow-md">
          <Scale className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
          {description && (
            <CardDescription className="text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
};