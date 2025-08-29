# AssistJur.IA - Template de Importação de Dados

## 📋 Visão Geral

Este é o template **CANÔNICO** para importação de dados no AssistJur.IA. Use exatamente os headers e formatos especificados para garantir compatibilidade 100% com o sistema.

## 📁 Arquivos Disponíveis

- **`AssistJurIA_Template.xlsx`** - Template principal (recomendado)
- **`por_processo.csv`** - Template CSV para dados por processo  
- **`por_testemunha.csv`** - Template CSV para dados por testemunha

## 🎯 Headers Obrigatórios

### Por Processo (22 campos)
```
CNJ, Status, Fase, UF, Comarca, Reclamantes, Advogados_Ativo, 
Testemunhas_Ativo, Testemunhas_Passivo, Todas_Testemunhas, 
Reclamante_Foi_Testemunha, Qtd_Reclamante_Testemunha, 
CNJs_Reclamante_Testemunha, Reclamante_Testemunha_Polo_Passivo, 
CNJs_Passivo, Triangulacao_Confirmada, Desenho_Triangulacao, 
CNJs_Triangulacao, Contem_Prova_Emprestada, Testemunhas_Prova_Emprestada, 
Classificacao_Final, Insight_Estrategico
```

### Por Testemunha (15 campos)
```
Nome_Testemunha, Qtd_Depoimentos, CNJs_Como_Testemunha, 
Ja_Foi_Reclamante, CNJs_Como_Reclamante, Foi_Testemunha_Ativo, 
Foi_Testemunha_Passivo, CNJs_Passivo, Foi_Ambos_Polos, 
Participou_Troca_Favor, CNJs_Troca_Favor, Participou_Triangulacao, 
CNJs_Triangulacao, E_Prova_Emprestada, Classificacao, Classificacao_Estrategica
```

## 📐 Regras de Preenchimento

### 1. **CNJ - CRÍTICO ⚠️**
- Manter formato **original como string**
- O sistema valida 20 dígitos internamente
- **NÃO reformatar** células no Excel
- ✅ `0001234562024501001` (string)
- ❌ `1234562024501001` (número)

### 2. **Listas - Separador `;` (ponto e vírgula)**
- **USAR**: `João Silva; Maria Santos; Pedro Costa`
- **NÃO USAR**: `["João Silva", "Maria Santos"]` (colchetes)
- **NÃO USAR**: `João Silva, Maria Santos` (apenas vírgula)

### 3. **Booleanos**
- **USAR**: `true` / `false`
- **ACEITO**: `sim` / `não`, `1` / `0`

### 4. **Campos Vazios**
- **USAR**: `—` (travessão) ou célula vazia
- **NÃO USAR**: `null`, `N/A`, `0`

### 5. **UF (Estado)**
- **FORMATO**: 2 letras maiúsculas
- **EXEMPLOS**: `SP`, `RJ`, `MG`

## 📝 Exemplos Válidos

### Por Processo
```csv
CNJ,Status,Fase,UF,Comarca,Reclamantes,Advogados_Ativo,Testemunhas_Ativo,Testemunhas_Passivo,Todas_Testemunhas,Reclamante_Foi_Testemunha,Qtd_Reclamante_Testemunha,CNJs_Reclamante_Testemunha,Reclamante_Testemunha_Polo_Passivo,CNJs_Passivo,Triangulacao_Confirmada,Desenho_Triangulacao,CNJs_Triangulacao,Contem_Prova_Emprestada,Testemunhas_Prova_Emprestada,Classificacao_Final,Insight_Estrategico
0001234562024501001,Em andamento,Instrução,RJ,Rio de Janeiro,Ana Lima,"Dr. Xavier Silva; Dra. Yasmim Oliveira",João Pereira,—,"João Pereira; Beatriz Nunes",true,1,0009876122023504002,false,—,true,A→B→C→A,"0001; 0002; 0003",true,João Pereira,Risco Alto,Triangulação + prova emprestada
```

### Por Testemunha
```csv
Nome_Testemunha,Qtd_Depoimentos,CNJs_Como_Testemunha,Ja_Foi_Reclamante,CNJs_Como_Reclamante,Foi_Testemunha_Ativo,Foi_Testemunha_Passivo,CNJs_Passivo,Foi_Ambos_Polos,Participou_Troca_Favor,CNJs_Troca_Favor,Participou_Triangulacao,CNJs_Triangulacao,E_Prova_Emprestada,Classificacao,Classificacao_Estrategica
João Pereira,12,"0001234562024501001; 0009876122023504002",false,—,true,false,—,false,true,CNJ_A↔CNJ_B,true,"0001; 0002; 0003",true,ALTA,CRÍTICO
```

## 🔄 Sinônimos Aceitos (Mapeamento Automático)

O sistema reconhece estes nomes alternativos, mas o template usa sempre o nome canônico:

| Canônico | Sinônimos Aceitos |
|----------|-------------------|
| `CNJ` | `cnj`, `numero_cnj`, `processo` |
| `Advogados_Ativo` | `Advogados (Polo Ativo)`, `advogados_polo_ativo` |
| `Todas_Testemunhas` | `Testemunhas_Todas`, `testemunhas` |
| `CNJs_Como_Testemunha` | `CNJs_Testemunha`, `processos_como_testemunha` |

## ❌ Erros Comuns e Soluções

### 1. **CNJ como Número**
- **ERRO**: Excel converte CNJ em número científico
- **SOLUÇÃO**: Formatar coluna como "Texto" antes de colar dados

### 2. **Listas com Colchetes**
- **ERRO**: `["Ana Silva", "João Santos"]`
- **SOLUÇÃO**: `Ana Silva; João Santos`

### 3. **Vírgula Decimal**
- **ERRO**: `1,5` (confundido com separador de lista)
- **SOLUÇÃO**: `1.5` (ponto decimal)

### 4. **Campos Obrigatórios Vazios**
- **ERRO**: CNJ, UF, Comarca vazios
- **SOLUÇÃO**: Preencher todos os campos marcados como obrigatórios

### 5. **Encoding de Caracteres**
- **ERRO**: Acentos "quebrados" 
- **SOLUÇÃO**: Salvar CSV como UTF-8 com BOM

## 🔧 Campos Obrigatórios vs Opcionais

### Por Processo - Obrigatórios ⚠️
- `CNJ`, `UF`, `Comarca`, `Reclamantes`, `Advogados_Ativo`, `Todas_Testemunhas`

### Por Testemunha - Obrigatórios ⚠️
- `Nome_Testemunha`, `Qtd_Depoimentos`, `CNJs_Como_Testemunha`

### Todos os Demais
- **Opcionais** - podem ser deixados vazios ou preenchidos com `—`

## 🎨 Dicas do Excel

### Validação de Dados
1. **Booleanos**: Criar dropdown com `true;false`
2. **UF**: Criar dropdown com estados válidos
3. **CNJ**: Formatar coluna como "Texto"

### Formatação Condicional
- **Células vazias**: Destacar em amarelo
- **CNJ inválido**: Destacar em vermelho (se não tiver 20 dígitos)

## 📊 Limites Técnicos

- **Máximo de registros**: 5.000 por importação
- **Tamanho do arquivo**: 50MB (XLSX/CSV)
- **Encoding**: UTF-8 com BOM
- **Separador CSV**: Vírgula (`,`)

## 🔍 Validação Automática

O sistema **automaticamente**:
- ✅ Valida CNJs (20 dígitos)
- ✅ Normaliza listas (`;` para array)
- ✅ Converte booleanos
- ✅ Aplica sinônimos de colunas
- ✅ Gera relatório de erros/warnings

## 🆘 Suporte

Em caso de dúvidas sobre o template:
1. Consulte este README
2. Verifique os arquivos de exemplo
3. Use o validador integrado do sistema
4. Entre em contato com o suporte técnico

---

**Versão do Template**: 1.0.0  
**Última Atualização**: 2024-01-29  
**Compatível com**: AssistJur.IA v2.0+