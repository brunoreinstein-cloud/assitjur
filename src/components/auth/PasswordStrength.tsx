import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  {
    label: 'Pelo menos 6 caracteres',
    test: (password) => password.length >= 6
  }
];

export const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  const analysis = useMemo(() => {
    if (!password) {
      return {
        score: 0,
        percentage: 0,
        strength: 'Muito fraca',
        color: 'bg-gray-300',
        requirements: requirements.map(req => ({ ...req, met: false }))
      };
    }

    const metRequirements = requirements.map(req => ({
      ...req,
      met: req.test(password)
    }));

    const score = metRequirements.filter(req => req.met).length;
    const percentage = (score / requirements.length) * 100;

    const strength = score >= 1 ? 'Forte' : 'Muito fraca';
    const color = score >= 1 ? 'bg-green-500' : 'bg-red-500';

    return {
      score,
      percentage,
      strength,
      color,
      requirements: metRequirements
    };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Força da senha:</span>
          <span className="font-medium">{analysis.strength}</span>
        </div>
        <Progress 
          value={analysis.percentage} 
          className="h-2"
        />
      </div>

      <div className="space-y-1">
        {analysis.requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="h-3 w-3 text-green-600" aria-hidden="true" focusable="false" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" focusable="false" />
            )}
            <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};