import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Undo2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeleteOptions<T> {
  key: string; // unique identifier
  label: string; // label to show in toast
  onDelete: () => T | null; // perform deletion and return removed item
  onRestore: (item: T) => void; // restore item if undo
}

export function useUndoDelete<T>(resource: string) {
  const { toast } = useToast();
  const queueRef = useRef(new Map<string, T>());

  const remove = ({ key, label, onDelete, onRestore }: DeleteOptions<T>) => {
    // Perform deletion
    const removed = onDelete();
    if (!removed) return; // nothing deleted

    // Ensure idempotency: replace any existing pending action for the same key
    queueRef.current.set(key, removed);

    const undo = () => {
      const original = queueRef.current.get(key);
      if (!original) return; // already handled
      onRestore(original);
      queueRef.current.delete(key);
    };

    toast({
      title: `${resource} removido`,
      description: (
        <div className="flex items-center justify-between">
          <span>{label}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            className="ml-2 h-6 px-2 text-xs"
          >
            <Undo2 className="h-3 w-3 mr-1" />
            Desfazer
          </Button>
        </div>
      ),
      duration: 5000,
    });

    // Remove from queue after timeout to finalize deletion
    setTimeout(() => {
      queueRef.current.delete(key);
    }, 5000);
  };

  return { remove };
}
