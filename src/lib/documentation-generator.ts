/**
 * Gerador de documentação automática
 * Cria documentação dinâmica sobre padrões de error handling e boas práticas
 */

import { logger } from "@/lib/logger";

interface DocumentationSection {
  title: string;
  content: string;
  examples: string[];
  antipatterns?: string[];
  category:
    | "error-handling"
    | "validation"
    | "api"
    | "performance"
    | "security";
}

export class DocumentationGenerator {
  private sections: DocumentationSection[] = [];

  constructor() {
    this.initializeStandardSections();
  }

  private initializeStandardSections() {
    // Error Handling
    this.addSection({
      title: "Sistema Centralizado de Error Handling",
      category: "error-handling",
      content: `
O AssistJur.IA utiliza um sistema centralizado de tratamento de erros para garantir:
- Logging estruturado e consistente
- Mensagens de erro padronizadas para o usuário  
- Retry automático com exponential backoff
- Categorização de erros por tipo (validation, network, business, etc.)
- Fallbacks inteligentes para operações críticas
      `,
      examples: [
        `
// ✅ CORRETO - Use o sistema centralizado
import { withErrorHandling, createError } from '@/lib/error-handling';

const fetchData = async () => {
  return await withErrorHandling(async () => {
    const response = await api.getData();
    return response;
  }, 'ServiceName.fetchData');
};
        `,
        `
// ✅ CORRETO - Criação de erros tipados
throw createError.validation('CNJ inválido', { cnj: '123' });
throw createError.network('API indisponível', true); // retryable
throw createError.business('Operação não permitida', 'Usuário sem permissão');
        `,
      ],
      antipatterns: [
        `
// ❌ ERRADO - Console.error direto
try {
  await someOperation();
} catch (error) {
  console.error('Error:', error); // Não fazer isso!
  throw error;
}
        `,
        `
// ❌ ERRADO - Mensagens hardcoded sem contexto
throw new Error('Algo deu errado'); // Muito genérico
        `,
      ],
    });

    // Validation
    this.addSection({
      title: "Sistema de Validação com Zod",
      category: "validation",
      content: `
Todas as validações devem usar o sistema centralizado com Zod:
- Schemas reutilizáveis para entidades comuns
- Validação runtime com mensagens em português
- Type guards para verificações seguras
- Validações específicas do domínio (CNJ, org_id, etc.)
      `,
      examples: [
        `
// ✅ CORRETO - Usar schemas centralizados
import { validateData, ProcessoSchema } from '@/lib/validation';

const processo = validateData(ProcessoSchema, rawData);
        `,
        `
// ✅ CORRETO - Type guards para verificações
import { isValidOrgId, isValidCNJ } from '@/lib/error-handling';

if (!isValidOrgId(orgId)) {
  throw createError.validation('ID da organização inválido');
}
        `,
      ],
    });

    // API Best Practices
    this.addSection({
      title: "Padrões para Chamadas de API",
      category: "api",
      content: `
Todas as chamadas de API devem seguir os padrões estabelecidos:
- Usar apiCall() wrapper para timeout e retry automático
- Validação de entrada e saída
- Logging estruturado de requisições
- Fallbacks para operações críticas
- Headers de autenticação padronizados
      `,
      examples: [
        `
// ✅ CORRETO - Wrapper apiCall com configuração
import { apiCall } from '@/lib/error-handling';

const result = await apiCall(
  async () => {
    const response = await fetch(url, {
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },
  'ServiceName',
  { retries: 2, timeout: 30000, fallback: defaultData }
);
        `,
      ],
    });

    // Performance
    this.addSection({
      title: "Monitoramento de Performance",
      category: "performance",
      content: `
Use o sistema de observabilidade para monitorar performance:
- Instrumentação automática de funções críticas
- Métricas de tempo de resposta
- Detecção de memory leaks
- Alertas automáticos em desenvolvimento
      `,
      examples: [
        `
// ✅ CORRETO - Instrumentação automática
import { instrumented } from '@/lib/observability';

const processData = instrumented(
  async (data) => {
    // Processamento complexo
    return result;
  },
  'processData',
  'data-processing'
);
        `,
        `
// ✅ CORRETO - Hook para componentes
import { useObservability } from '@/lib/observability';

function MyComponent() {
  const { recordRender, recordInteraction } = useObservability('MyComponent');
  
  useEffect(() => {
    recordRender();
  }, []);
  
  return <button onClick={() => recordInteraction('click')}>Action</button>;
}
        `,
      ],
    });

    // Security
    this.addSection({
      title: "Práticas de Segurança",
      category: "security",
      content: `
Padrões de segurança obrigatórios:
- Nunca usar Service Role Key no frontend
- Validação de org_id em todas as queries
- Sanitização de inputs
- Rate limiting em formulários
- Logs estruturados sem dados sensíveis
      `,
      examples: [
        `
// ✅ CORRETO - Query com org_id obrigatório
const { data } = await supabase
  .from('processos')
  .select('*')
  .eq('org_id', profile.organization_id) // Sempre incluir!
  .eq('id', processId);
        `,
        `
// ✅ CORRETO - Rate limiting
const [lastAttempt, setLastAttempt] = useState(0);

const handleSubmit = async () => {
  const now = Date.now();
  if (now - lastAttempt < 60000) {
    toast.error('Aguarde 1 minuto entre tentativas');
    return;
  }
  setLastAttempt(now);
  // ... resto da lógica
};
        `,
      ],
      antipatterns: [
        `
// ❌ ERRADO - Query sem org_id (vaza dados!)
const { data } = await supabase
  .from('processos')
  .select('*')
  .eq('id', processId); // Sem org_id = acesso a todos os dados!
        `,
      ],
    });
  }

  addSection(section: DocumentationSection) {
    this.sections.push(section);
    logger.info(
      "Documentation section added",
      {
        title: section.title,
        category: section.category,
      },
      "DocumentationGenerator",
    );
  }

  generateMarkdown(): string {
    const categorizedSections = this.groupByCategory();

    let markdown = `# AssistJur.IA - Guia de Desenvolvimento\n\n`;
    markdown += `*Documentação gerada automaticamente em ${new Date().toLocaleString("pt-BR")}*\n\n`;

    // Índice
    markdown += `## Índice\n\n`;
    Object.entries(categorizedSections).forEach(([category, sections]) => {
      markdown += `### ${this.getCategoryTitle(category)}\n`;
      sections.forEach((section) => {
        markdown += `- [${section.title}](#${this.slugify(section.title)})\n`;
      });
      markdown += `\n`;
    });

    // Conteúdo
    Object.entries(categorizedSections).forEach(([category, sections]) => {
      markdown += `\n## ${this.getCategoryTitle(category)}\n\n`;

      sections.forEach((section) => {
        markdown += `### ${section.title}\n\n`;
        markdown += `${section.content}\n\n`;

        if (section.examples.length > 0) {
          markdown += `**Exemplos:**\n\n`;
          section.examples.forEach((example) => {
            markdown += `\`\`\`typescript${example}\`\`\`\n\n`;
          });
        }

        if (section.antipatterns && section.antipatterns.length > 0) {
          markdown += `**⚠️ Antipadrões - NÃO FAZER:**\n\n`;
          section.antipatterns.forEach((antipattern) => {
            markdown += `\`\`\`typescript${antipattern}\`\`\`\n\n`;
          });
        }
      });
    });

    // Apêndice com comandos úteis
    markdown += this.generateAppendix();

    return markdown;
  }

  generateHTML(): string {
    const markdown = this.generateMarkdown();

    // Conversão básica de Markdown para HTML
    const html = markdown
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(
        /```typescript([\s\S]*?)```/g,
        '<pre><code class="language-typescript">$1</code></pre>',
      )
      .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AssistJur.IA - Guia de Desenvolvimento</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6; 
      max-width: 1200px; 
      margin: 0 auto; 
      padding: 20px;
      color: #333;
    }
    pre { 
      background: #f5f5f5; 
      padding: 1rem; 
      border-radius: 8px; 
      overflow-x: auto;
      border-left: 4px solid #007acc;
    }
    code { 
      background: #f5f5f5; 
      padding: 2px 6px; 
      border-radius: 4px; 
      font-family: 'Monaco', 'Menlo', monospace;
    }
    h1 { color: #007acc; border-bottom: 2px solid #007acc; }
    h2 { color: #0366d6; border-bottom: 1px solid #eee; }
    h3 { color: #6a737d; }
    .timestamp { color: #6a737d; font-style: italic; }
    ul { padding-left: 20px; }
    li { margin: 4px 0; }
  </style>
</head>
<body>
  ${html}
</body>
</html>
    `;
  }

  private groupByCategory(): Record<string, DocumentationSection[]> {
    return this.sections.reduce(
      (acc, section) => {
        if (!acc[section.category]) {
          acc[section.category] = [];
        }
        acc[section.category].push(section);
        return acc;
      },
      {} as Record<string, DocumentationSection[]>,
    );
  }

  private getCategoryTitle(category: string): string {
    const titles = {
      "error-handling": "🛡️ Tratamento de Erros",
      validation: "✅ Validação de Dados",
      api: "🌐 APIs e Requisições",
      performance: "⚡ Performance e Monitoramento",
      security: "🔐 Segurança",
    };

    return titles[category as keyof typeof titles] || category;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-");
  }

  private generateAppendix(): string {
    return `
## 🔧 Comandos Úteis para Debug

Em desenvolvimento, você pode usar os seguintes comandos no console do navegador:

### Health Check Completo
\`\`\`javascript
await __DEV_DIAGNOSTICS__.runHealthCheck()
\`\`\`

### Executar Testes de Regressão
\`\`\`javascript
await __DEV_DIAGNOSTICS__.runRegressionTests()
\`\`\`

### Ver Métricas de Performance
\`\`\`javascript
__DEV_DIAGNOSTICS__.getMetrics()
\`\`\`

### Análise do Bundle
\`\`\`javascript
__DEV_DIAGNOSTICS__.analyzeBundle()
\`\`\`

## 📈 Métricas e Alertas

O sistema monitora automaticamente:
- Tempo de resposta das APIs
- Uso de memória
- Taxa de erro por categoria
- Performance de componentes React
- Qualidade do código (console.error deprecated, etc.)

## 🆘 Solução de Problemas Comuns

### "console.error usage detected"
Substitua por: \`logger.error(message, context, service)\`

### "Direct API call without error handling"
Use: \`withErrorHandling(() => apiCall(), 'ServiceName')\`

### "Query without org_id"
Sempre incluir: \`.eq('org_id', profile.organization_id)\`

### "Memory leak detected"
Verifique: event listeners não removidos, referências circulares, objetos grandes no estado

---
*Esta documentação é gerada automaticamente baseada nos padrões implementados no código.*
    `;
  }

  // Salvar documentação como arquivo
  async saveToFile(format: "markdown" | "html" = "markdown") {
    const content =
      format === "html" ? this.generateHTML() : this.generateMarkdown();
    const filename = `assistjur-dev-guide.${format === "html" ? "html" : "md"}`;

    const blob = new Blob([content], {
      type: format === "html" ? "text/html" : "text/markdown",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info(
      "Documentation exported",
      {
        format,
        filename,
        sections: this.sections.length,
      },
      "DocumentationGenerator",
    );
  }
}

// Instância singleton
export const documentationGenerator = new DocumentationGenerator();

// Disponibilizar no console em desenvolvimento
if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).__DOCS_GENERATOR__ = {
    generateMarkdown: () => documentationGenerator.generateMarkdown(),
    saveMarkdown: () => documentationGenerator.saveToFile("markdown"),
    saveHTML: () => documentationGenerator.saveToFile("html"),
    addCustomSection: (section: DocumentationSection) =>
      documentationGenerator.addSection(section),
  };
}
