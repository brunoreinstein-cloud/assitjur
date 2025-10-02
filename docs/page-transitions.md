# PageTransition

Componente para transições suaves entre páginas usando Framer Motion.

## Uso

Já integrado no `AppLayout.tsx`, todas as páginas autenticadas têm transições automáticas.

### Manual (se necessário)
```tsx
import { PageTransition } from '@/components/core/PageTransition';

<PageTransition>
  <YourPageContent />
</PageTransition>
```

## Animação

### Entrada (enter)
- Opacity: 0 → 1
- TranslateY: 20px → 0
- Duration: 300ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

### Saída (exit)
- Opacity: 1 → 0
- TranslateY: 0 → -20px
- Duration: 200ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

## Accessibility

Respeita `prefers-reduced-motion`:
```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  return <>{children}</>; // Sem animação
}
```

## Integração com React Router

Usa `useLocation()` para detectar mudanças de rota:
```tsx
const location = useLocation();

<AnimatePresence mode="wait" initial={false}>
  <motion.div key={location.pathname}>
    {children}
  </motion.div>
</AnimatePresence>
```

## Performance

- AnimatePresence mode="wait" - Uma página por vez
- initial={false} - Sem animação no mount inicial
- GPU-accelerated (transform, opacity)

## Desativar Globalmente

Remova do `AppLayout.tsx`:
```tsx
// Antes
<PageTransition>
  <PageFade>{children}</PageFade>
</PageTransition>

// Depois
<PageFade>{children}</PageFade>
```
