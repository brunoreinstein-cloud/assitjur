import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  File, 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  X,
  Download,
  Eye
} from 'lucide-react';
import { useChatStore } from '@/stores/useChatStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getFileIcon = (ext?: string) => {
  if (!ext) return File;
  
  switch (ext.toLowerCase()) {
    case 'pdf':
      return File;
    case 'doc':
    case 'docx':
      return File;
    case 'xls':
    case 'xlsx':
      return File;
    default:
      return File;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ready':
      return CheckCircle2;
    case 'uploading':
    case 'indexing':
      return Loader2;
    case 'error':
      return AlertCircle;
    default:
      return File;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ready':
      return 'text-green-600';
    case 'uploading':
    case 'indexing':
      return 'text-blue-600';
    case 'error':
      return 'text-red-600';
    default:
      return 'text-muted-foreground';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'uploading':
      return 'Enviando...';
    case 'indexing':
      return 'Indexando...';
    case 'ready':
      return 'Pronto';
    case 'error':
      return 'Erro';
    default:
      return status;
  }
};

export function AttachmentsList() {
  const { attachments, addAttachment } = useChatStore();

  // Mock file upload
  const handleFileUpload = () => {
    const mockFile = {
      conversationId: 'current',
      kind: 'file' as const,
      name: 'relatorio-processos.pdf',
      ext: 'pdf',
      size: 2048576,
      status: 'uploading' as const
    };
    
    const attachmentId = addAttachment(mockFile);
    
    // Simulate upload progress
    setTimeout(() => {
      // Update to indexing
      // In real app, you'd update the attachment status
    }, 2000);
    
    setTimeout(() => {
      // Update to ready
      // In real app, you'd update the attachment status
    }, 4000);
  };

  // Mock URL addition
  const handleAddURL = () => {
    const mockURL = {
      conversationId: 'current',
      kind: 'url' as const,
      name: 'Jurisprudência TST - Triangulação',
      status: 'indexing' as const
    };
    
    addAttachment(mockURL);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Anexos</h3>
          <Badge variant="outline" className="text-xs">
            {attachments.length}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleFileUpload}
          >
            <Upload className="w-4 h-4 mr-2" />
            Anexar Arquivo
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleAddURL}
          >
            <Link2 className="w-4 h-4 mr-2" />
            Adicionar URL
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {attachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum anexo</p>
              <p className="text-xs">
                Anexe arquivos ou URLs para enriquecer a análise
              </p>
            </div>
          ) : (
            attachments.map((attachment) => {
              const FileIcon = attachment.kind === 'url' ? Link2 : getFileIcon(attachment.ext);
              const StatusIcon = getStatusIcon(attachment.status);
              const statusColor = getStatusColor(attachment.status);
              
              return (
                <Card key={attachment.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileIcon className="w-4 h-4 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm truncate">
                            {attachment.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusIcon 
                              className={`w-3 h-3 ${statusColor} ${
                                attachment.status === 'uploading' || attachment.status === 'indexing' 
                                  ? 'animate-spin' 
                                  : ''
                              }`} 
                            />
                            <span className={`text-xs ${statusColor}`}>
                              {getStatusLabel(attachment.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* File details */}
                    <div className="space-y-2">
                      {attachment.size && (
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.size)}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(attachment.createdAt, { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </div>
                      
                      {/* Progress bar for uploading/indexing */}
                      {(attachment.status === 'uploading' || attachment.status === 'indexing') && (
                        <Progress 
                          value={attachment.status === 'uploading' ? 45 : 80} 
                          className="h-1"
                        />
                      )}
                      
                      {/* Actions for ready files */}
                      {attachment.status === 'ready' && (
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="w-3 h-3 mr-1" />
                            Ver
                          </Button>
                          {attachment.kind === 'file' && (
                            <Button variant="outline" size="sm">
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {/* Error message */}
                      {attachment.status === 'error' && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          Falha no processamento. Tente novamente.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
      
      {/* Upload tips */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground space-y-1">
          <div>• Formatos: PDF, DOC, XLS, TXT</div>
          <div>• Tamanho máximo: 10MB</div>
          <div>• URLs são indexadas automaticamente</div>
        </div>
      </div>
    </div>
  );
}