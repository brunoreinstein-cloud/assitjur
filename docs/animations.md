# Sistema de Animações - Sprint 4

## Animações Disponíveis

### Fade & Slide
- `animate-fade-in`: Fade in com movimento para cima (600ms)
- `animate-slide-up`: Slide para cima com fade (500ms)
- `animate-slide-in-right`: Slide da direita com fade (300ms)

### Scale & Transform
- `animate-scale-in`: Scale in com fade (400ms)
- `hover:scale-105`: Hover scale sutil
- `active:scale-95`: Active state com escala reduzida

### Interações
- `animate-shimmer`: Efeito shimmer para skeletons
- `animate-shake`: Shake para erros
- `animate-glow-pulse`: Pulse glow para highlights

### Accordions
- `animate-accordion-down`: Expansão de accordion
- `animate-accordion-up`: Colapso de accordion

## Uso em Componentes

### Buttons
```tsx
<Button 
  variant="default"
  className="hover:scale-105 active:scale-95"
>
  Click me
</Button>
```

### Cards
```tsx
<Card className="hover:shadow-md hover:-translate-y-1 hover:border-primary/20">
  {/* Content */}
</Card>
```

### Empty States
```tsx
<EmptyState 
  variant="no-data"
  className="animate-fade-in"
/>
```

### Skeletons
```tsx
<Skeleton className="animate-shimmer" />
```

## Accessibility

Todas as animações respeitam `prefers-reduced-motion`:
- PageTransition detecta automaticamente
- Componentes devem checar antes de animar

```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  return <StaticComponent />;
}
```

## Guidelines

1. **Performance**: Use `transform` e `opacity` para animações (GPU-accelerated)
2. **Duration**: Mantenha entre 200-600ms para UX responsiva
3. **Easing**: Use `ease-out` para entrada, `ease-in` para saída
4. **Subtlety**: Animações devem ser sutis e profissionais
5. **Purpose**: Toda animação deve ter um propósito UX claro
