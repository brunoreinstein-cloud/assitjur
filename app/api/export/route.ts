import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/client';
import { logAudit } from '@/lib/audit';
import { SITE_URL } from '@/config/site';
import { corsHeaders } from '../_shared/cors';
import { initSentry } from '../_shared/sentry';

const sentry = initSentry();

const maintenance =
  process.env.MAINTENANCE === 'true' || process.env.NEXT_PUBLIC_MAINTENANCE === 'true';
const retryAfter = process.env.RETRY_AFTER || '3600';

export async function POST(request: NextRequest) {
  const headers = { ...corsHeaders };
  if (maintenance) {
    return NextResponse.json(
      { error: 'Service under maintenance' },
      { status: 503, headers: { ...headers, 'Retry-After': retryAfter } }
    );
  }
  try {
    const { messageId, type, blocks } = await request.json();
    
    // Get auth header from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers }
      );
    }

    // Verify user authentication
    const supabaseClient = supabase;
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401, headers }
      );
    }

    // Get user profile for audit logging
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404, headers }
      );
    }

    // Generate export based on type
    let exportData;
    let filename;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

    switch (type) {
      case 'pdf':
        exportData = await generatePDF(blocks, messageId);
        filename = `relatorio-${messageId.slice(0, 8)}-${timestamp}.pdf`;
        break;
        
      case 'csv':
        exportData = await generateCSV(blocks);
        filename = `dados-${messageId.slice(0, 8)}-${timestamp}.csv`;
        break;
        
      case 'json':
        exportData = JSON.stringify(blocks, null, 2);
        filename = `estrutura-${messageId.slice(0, 8)}-${timestamp}.json`;
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid export type' },
          { status: 400, headers }
        );
    }

    // For now, create a mock download URL
    // In production, this would upload to storage bucket and return signed URL
    const mockUrl = `${SITE_URL}/exports/${filename}`;

    // Log audit entry
    try {
      await logAudit(
        `EXPORT_${type.toUpperCase()}`,
        'chat_message',
        messageId,
        {
          exportType: type,
          filename,
          timestamp: new Date().toISOString()
        }
      );
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
      // Don't fail the export if audit logging fails
    }

    return NextResponse.json({
      url: mockUrl,
      filename,
      type,
      size: exportData.length,
      createdAt: new Date().toISOString()
    }, { headers });

  } catch (error) {
    console.error('Export API Error:', error);
    (await sentry)?.captureException?.(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

async function generatePDF(blocks: any[], messageId: string): Promise<string> {
  // Mock PDF generation - in production, use a library like jsPDF or Puppeteer
  const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length ${JSON.stringify(blocks).length + 200}
>>
stream
BT
/F1 12 Tf
72 720 Td
(AssistJur.IA - Relatório de Análise) Tj
0 -20 Td
(Gerado em: ${new Date().toLocaleString('pt-BR')}) Tj
0 -40 Td
(${JSON.stringify(blocks, null, 2).slice(0, 500)}...) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${JSON.stringify(blocks).length + 400}
%%EOF
`;
  
  return pdfContent;
}

async function generateCSV(blocks: any[]): Promise<string> {
  let csvContent = 'Tipo,Título,Dados,Citações\n';
  
  blocks.forEach(block => {
    const data = typeof block.data === 'object' ? JSON.stringify(block.data).replace(/"/g, '""') : block.data;
    const citations = block.citations ? block.citations.map((c: any) => `${c.source}:${c.ref}`).join(';') : '';
    
    csvContent += `"${block.type}","${block.title}","${data}","${citations}"\n`;
  });
  
  return csvContent;
}