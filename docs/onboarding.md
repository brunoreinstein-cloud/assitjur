# Sistema de Onboarding - Feature Tours

## Componentes

### FeatureTour
Tour guiado para diferentes áreas do sistema.

#### Uso Básico
```tsx
import { FeatureTour } from '@/components/onboarding/FeatureTour';

<FeatureTour 
  type="mapa" 
  run={showTour}
  onFinish={() => setShowTour(false)}
/>
```

#### Tipos de Tours
- `mapa`: Tour do Mapa de Testemunhas
- `dashboard`: Tour do Dashboard Admin
- `admin`: Tour das Configurações Admin

### Hook useTour
```tsx
import { useTour } from '@/components/onboarding/FeatureTour';

function MyPage() {
  const { run, startTour, resetTour, FeatureTour } = useTour('mapa');
  
  return (
    <>
      <Button onClick={startTour}>Iniciar Tour</Button>
      <FeatureTour />
    </>
  );
}
```

## Marcação de Elementos

Para que os tours funcionem, marque elementos com `data-tour`:

```tsx
<div data-tour="filters">
  {/* Filtros */}
</div>

<div data-tour="table">
  {/* Tabela */}
</div>

<div data-tour="chat">
  {/* Chat */}
</div>

<div data-tour="export">
  {/* Botão de exportar */}
</div>
```

## Personalização

Tours salvam completude no localStorage:
- Chave: `tour-{type}-completed`
- Valor: `'true'` quando completo

Para forçar tour novamente:
```tsx
const { resetTour } = useTour('mapa');
resetTour(); // Limpa localStorage e reinicia
```

## Estilo

Tours usam cores do design system:
- Primary color: `hsl(257, 42%, 51%)`
- Border radius: `8px`
- Z-index: `10000`

## Textos em Português

Todos os botões e labels estão traduzidos:
- "Voltar"
- "Próximo"
- "Finalizar"
- "Pular tour"
