import { useState } from "react";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AssistJurPanelProps {
  sessionId: string;
  response: string;
  comment?: string;
}

export function AssistJurPanel({ sessionId, response }: AssistJurPanelProps) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleRate = async (value: number) => {
    if (submitted) return;
    setRating(value);

    try {
      await fetch("/api/csat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, score: value }),
      });
      toast({ title: "Obrigado!" });
      setSubmitted(true);
    } catch (error) {
      toast({ title: "Erro ao enviar feedback", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div>{response}</div>
      {!submitted && (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleRate(n)}
              className="text-muted-foreground hover:text-yellow-500"
              aria-label={`Avaliar ${n}`}
            >
              <Star
                className={`h-5 w-5 ${n <= rating ? "fill-yellow-500 text-yellow-500" : ""}`}
              />
            </button>
          ))}
        </div>
      )}
      {submitted && (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`h-5 w-5 ${n <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
