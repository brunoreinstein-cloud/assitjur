# HelpWidget

Widget flutuante de ajuda com links rápidos para documentação, tutoriais e suporte.

## Uso

### Global (recomendado)
Já está integrado no App.tsx e aparece em todas as páginas autenticadas:

```tsx
// Já incluído no App.tsx
<HelpWidget />
```

### Local (se necessário)
```tsx
import { HelpWidget } from '@/components/help/HelpWidget';

<HelpWidget />
```

## Hook useHelpShortcut

Para detectar atalho de teclado `?`:

```tsx
import { useHelpShortcut } from '@/components/help/HelpWidget';

function MyComponent() {
  const { isOpen, setIsOpen } = useHelpShortcut();
  
  return (
    <div>
      {isOpen && <HelpDialog onClose={() => setIsOpen(false)} />}
    </div>
  );
}
```

## Links Padrão

1. **Documentação** - Guias completos
2. **Vídeos Tutoriais** - Aprenda visualmente
3. **Suporte** - Entre em contato
4. **Novidades** - Changelog (badge "Novo")

## Personalização

Edite `helpLinks` em `HelpWidget.tsx`:

```tsx
const helpLinks: HelpLink[] = [
  {
    icon: <FileText className="h-5 w-5" />,
    title: 'Meu Link',
    description: 'Descrição',
    href: '/caminho',
    isNew: true // Badge opcional
  },
];
```

## Atalhos

- **?** - Abre/fecha o widget
- Não funciona em inputs/textareas

## Posicionamento

- Fixed bottom-right
- `z-index: 50`
- 24px de margem (6 * 4px)

## Acessibilidade

- `aria-label` no botão
- Keyboard navigation completo
- Focus trap no popover
