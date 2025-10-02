import { useState, useCallback } from 'react';
import { Upload, User, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userInitials?: string;
  onUpload: (file: File) => void;
  isUploading?: boolean;
}

export function AvatarUpload({ 
  currentAvatarUrl, 
  userInitials = 'U',
  onUpload,
  isUploading = false
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Tamanho máximo: 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Tipo de arquivo inválido. Use imagens (JPEG, PNG, WebP)');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    onUpload(file);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 2 * 1024 * 1024, // 2MB
    multiple: false,
  });

  const displayUrl = preview || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-32 w-32">
        <AvatarImage src={displayUrl || undefined} alt="Avatar" />
        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
          {userInitials}
        </AvatarFallback>
      </Avatar>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : isDragActive ? (
            <Upload className="h-8 w-8 text-primary" />
          ) : (
            <User className="h-8 w-8 text-muted-foreground" />
          )}
          
          <div>
            <p className="text-sm font-medium">
              {isUploading ? 'Fazendo upload...' : isDragActive ? 'Solte a imagem aqui' : 'Clique ou arraste uma imagem'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG ou WebP (máx. 2MB)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
