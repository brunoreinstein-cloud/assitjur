import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { VALIDATION_PATTERNS } from "@/utils/security";
import { formatCNPJ, formatOAB } from "@/utils/inputMasks";
import { Loader2 } from "lucide-react";

const schema = z.object({
  cnpj: z.string().regex(VALIDATION_PATTERNS.CNPJ, "CNPJ inválido"),
  oab: z.string().regex(VALIDATION_PATTERNS.OAB, "OAB inválida"),
});

type FormData = z.infer<typeof schema>;

export function CnpjOabForm() {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const lastSubmitRef = useRef(0);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { cnpj: "", oab: "" },
  });

  const onSubmit = async (data: FormData) => {
    const now = Date.now();
    if (now - lastSubmitRef.current < 1000) return;
    lastSubmitRef.current = now;
    setIsPending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: "Dados enviados",
        description: "CNPJ e OAB salvos com sucesso.",
      });
      form.reset();
    } catch (e) {
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("cnpj", formatCNPJ(e.target.value));
  };

  const handleOABChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("oab", formatOAB(e.target.value));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="cnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={handleCNPJChange}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="oab"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OAB</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={handleOABChange}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar
        </Button>
      </form>
    </Form>
  );
}
