import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building, Code, Globe, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import {
  organizationSchema,
  type Organization,
} from "@/lib/validation-schemas";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";

export function GeneralTab() {
  const { settings, updateSettings, uploadAvatar } = useOrganizationSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<Organization>({
    resolver: zodResolver(organizationSchema),
    values: {
      name: settings?.name || "",
      code: settings?.code || "",
      domain: settings?.domain || "",
      cnpj: settings?.cnpj || "",
      primary_color: settings?.primary_color || "#2563eb",
      secondary_color: settings?.secondary_color || "#1e40af",
      session_timeout_minutes: settings?.session_timeout_minutes || 60,
      allow_concurrent_sessions: settings?.allow_concurrent_sessions ?? true,
    },
  });

  const onSubmit = async (data: Organization) => {
    setIsSubmitting(true);
    try {
      await updateSettings.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Tamanho máximo: 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    uploadAvatar.mutate(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/svg+xml": [".svg"],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const displayLogo = logoPreview || settings?.logo_url;
  const orgInitials = settings?.name
    ? settings.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "ORG";

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Logo da Organização</h3>

        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-32 w-32">
            <AvatarImage src={displayLogo || undefined} alt="Logo" />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {orgInitials}
            </AvatarFallback>
          </Avatar>

          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors w-full
              ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary"}
              ${uploadAvatar.isPending ? "opacity-50 pointer-events-none" : ""}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              <Image className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {uploadAvatar.isPending
                    ? "Fazendo upload..."
                    : isDragActive
                      ? "Solte o logo aqui"
                      : "Clique ou arraste o logo"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, WebP ou SVG (máx. 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Informações da Organização
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Organização *</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Minha Empresa LTDA"
                  className="pl-10"
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <div className="relative">
                <Code className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="code"
                  {...register("code")}
                  placeholder="MEMP"
                  className="pl-10"
                />
              </div>
              {errors.code && (
                <p className="text-sm text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domínio</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="domain"
                  {...register("domain")}
                  placeholder="https://minhaempresa.com.br"
                  className="pl-10"
                />
              </div>
              {errors.domain && (
                <p className="text-sm text-destructive">
                  {errors.domain.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cnpj"
                  {...register("cnpj")}
                  placeholder="12.345.678/0001-90"
                  className="pl-10"
                />
              </div>
              {errors.cnpj && (
                <p className="text-sm text-destructive">
                  {errors.cnpj.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="submit"
              disabled={!isDirty || isSubmitting}
              loading={isSubmitting}
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
