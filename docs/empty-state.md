# EmptyState

Componente para indicar ausência de dados ou resultados com animações suaves e variantes contextuais.

## Uso

```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

<EmptyState
  variant="no-results"
  title="Sem resultados"
  description="Tente ajustar os filtros para encontrar o que procura."
  action={<Button>Limpar Filtros</Button>}
/>;
```

## Variantes

### Contextuais

- `no-data`: Quando ainda não há dados (ícone: AlertCircle)
- `no-results`: Quando filtros não retornam resultados (ícone: Search)
- `error`: Estado de erro (ícone: AlertTriangle, vermelho)
- `permission-denied`: Sem permissão (ícone: ShieldOff, amarelo)

### Densidade

- `density`: `comfortable` | `compact`

## Exemplos

### Sem Dados

```tsx
<EmptyState
  variant="no-data"
  title="Nenhum processo importado"
  description="Comece importando dados através do menu Admin."
  action={<Button variant="professional">Importar Dados</Button>}
/>
```

### Erro

```tsx
<EmptyState
  variant="error"
  title="Erro ao carregar dados"
  description="Ocorreu um erro ao buscar as informações. Tente novamente."
  action={<Button variant="destructive">Tentar Novamente</Button>}
/>
```

### Sem Permissão

```tsx
<EmptyState
  variant="permission-denied"
  title="Acesso Negado"
  description="Você não tem permissão para visualizar estes dados."
/>
```

## Features

- Animação de fade-in automática
- Ícones contextuais por variante
- Ícone customizável
- Acessível (ARIA labels)
- Responsivo
