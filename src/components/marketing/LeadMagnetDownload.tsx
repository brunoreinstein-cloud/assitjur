import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, Shield, CheckCircle, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeadMagnetProps {
  title: string;
  description: string;
  type: string;
  pages: string;
  features: string[];
  downloadUrl: string;
  rating?: number;
  downloads?: number;
}

interface LeadForm {
  nome: string;
  email: string;
  empresa: string;
  cargo: string;
  aceiteTermos: boolean;
  aceiteComunicacao: boolean;
}

export function LeadMagnetDownload({
  title,
  description,
  type,
  pages,
  features,
  downloadUrl,
  rating = 4.9,
  downloads = 1247,
}: LeadMagnetProps) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<LeadForm>({
    nome: "",
    email: "",
    empresa: "",
    cargo: "",
    aceiteTermos: false,
    aceiteComunicacao: false,
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.aceiteTermos) {
      toast({
        title: "Termos obrigatórios",
        description: "É necessário aceitar os termos para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simular envio do lead
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: "Download liberado!",
        description: "Verifique seu email para acessar o material.",
      });

      // Iniciar download
      window.open(downloadUrl, "_blank");

      // Reset form
      setFormData({
        nome: "",
        email: "",
        empresa: "",
        cargo: "",
        aceiteTermos: false,
        aceiteComunicacao: false,
      });
      setShowForm(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showForm) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Baixar {type}
          </CardTitle>
          <CardDescription>
            Preencha os dados para liberar o download gratuito
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email profissional *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa/Escritório</Label>
              <Input
                id="empresa"
                value={formData.empresa}
                onChange={(e) =>
                  setFormData({ ...formData, empresa: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo/Função</Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) =>
                  setFormData({ ...formData, cargo: e.target.value })
                }
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="termos"
                  checked={formData.aceiteTermos}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      aceiteTermos: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="termos" className="text-xs leading-5">
                  Aceito os{" "}
                  <a href="/termos" className="text-primary underline">
                    termos de uso
                  </a>{" "}
                  e
                  <a
                    href="/privacidade"
                    className="text-primary underline ml-1"
                  >
                    política de privacidade
                  </a>{" "}
                  *
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="comunicacao"
                  checked={formData.aceiteComunicacao}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      aceiteComunicacao: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="comunicacao" className="text-xs leading-5">
                  Desejo receber conteúdos sobre compliance LGPD e novidades do
                  AssistJur.IA
                </Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.aceiteTermos}
                className="flex-1"
              >
                {isSubmitting ? (
                  "Processando..."
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md group hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-primary/10">
            {type}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {rating}
          </div>
        </div>
        <CardTitle className="text-lg leading-tight">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="w-4 h-4" />
          {pages}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Incluído neste material:</div>
          <ul className="space-y-1">
            {features.map((feature, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle className="w-3 h-3 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span>{downloads.toLocaleString()} downloads</span>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-primary" />
              LGPD Compliant
            </div>
          </div>

          <Button
            onClick={() => setShowForm(true)}
            className="w-full group-hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Gratuito
          </Button>
        </div>

        <div className="text-xs text-center text-muted-foreground">
          📧 Enviado por email • 🔒 Dados protegidos
        </div>
      </CardContent>
    </Card>
  );
}
