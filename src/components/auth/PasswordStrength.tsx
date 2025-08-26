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
    label: 'Pelo menos 8 caracteres',
    test: (password) => password.length >= 8
  },
  {
    label: 'Contém letra maiúscula',
    test: (password) => /[A-Z]/.test(password)
  },
  {
    label: 'Contém letra minúscula',
    test: (password) => /[a-z]/.test(password)
  },
  {
    label: 'Contém número',
    test: (password) => /[0-9]/.test(password)
  },
  {
    label: 'Contém símbolo especial',
    test: (password) => /[^A-Za-z0-9]/.test(password)
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

    let strength: string;
    let color: string;

    if (score <= 1) {
      strength = 'Muito fraca';
      color = 'bg-red-500';
    } else if (score <= 2) {
      strength = 'Fraca';
      color = 'bg-orange-500';
    } else if (score <= 3) {
      strength = 'Regular';
      color = 'bg-yellow-500';
    } else if (score <= 4) {
      strength = 'Forte';
      color = 'bg-green-500';
    } else {
      strength = 'Muito forte';
      color = 'bg-green-600';
    }

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
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
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