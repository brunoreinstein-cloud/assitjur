import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBetaFormStore } from "@/stores/useBetaFormStore";
import { Loader2 } from "lucide-react";

interface BetaModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function BetaModal({ isOpen = false, onClose }: BetaModalProps) {
  const [email, setEmail] = useState("");
  const { loading, submitBeta } = useBetaFormStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    if (formData.get("website")) return;

    if (!email) return;

    // Temporarily set the email in the store for submission
    useBetaFormStore.getState().setEmail(email);
    useBetaFormStore.getState().setNeeds(["Outros"]); // Default need for modal

    const success = await submitBeta();

    if (success) {
      setEmail("");
      onClose?.();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Entrar na Lista Beta
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            name="website"
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail corporativo *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@empresa.com"
                required
                disabled={loading}
                className="mt-1"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Seus dados serão usados apenas para contato sobre o Beta. Estamos
              em conformidade com a LGPD.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={loading || !email}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Entrar na Lista Beta"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
