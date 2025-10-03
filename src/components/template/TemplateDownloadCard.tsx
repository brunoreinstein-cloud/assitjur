import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

interface TemplateDownloadCardProps {
  title: string;
  description: string;
  downloadUrl: string;
  icon: "xlsx" | "csv";
  filename: string;
  recommended?: boolean;
}

export function TemplateDownloadCard({
  title,
  description,
  downloadUrl,
  icon,
  filename,
  recommended = false,
}: TemplateDownloadCardProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card
      className={`relative transition-all hover:shadow-lg ${recommended ? "border-primary" : ""}`}
    >
      {recommended && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
            Recomendado
          </div>
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {icon === "xlsx" ? (
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
          ) : (
            <FileText className="h-6 w-6 text-blue-600" />
          )}
          {title}
        </CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleDownload}
          className="w-full"
          variant={recommended ? "default" : "outline"}
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar {filename}
        </Button>
      </CardContent>
    </Card>
  );
}
