# EmptyState

Componente para indicar ausência de dados ou resultados.

## Uso

```tsx
import { EmptyState } from "@/components/ui/empty-state";

<EmptyState
  title="Sem resultados"
  description="Tente ajustar os filtros."
  action={<button className="btn">Recarregar</button>}
/>
```

## Variantes

- `density`: `comfortable` | `compact`
