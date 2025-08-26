import { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { cva } from "class-variance-authority";

const alertVariants = cva(
  "border-l-4",
  {
    variants: {
      variant: {
        info: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/30",
        success: "border-l-green-500 bg-green-50 dark:bg-green-950/30",
        warning: "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30", 
        error: "border-l-red-500 bg-red-50 dark:bg-red-950/30"
      }
    }
  }
);

interface AlertBoxProps {
  variant: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
  className?: string;
}

export const AlertBox = ({ variant, title, children, className }: AlertBoxProps) => {
  const getIcon = () => {
    switch (variant) {
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'info':
        return 'text-blue-700 dark:text-blue-300';
      case 'success':
        return 'text-green-700 dark:text-green-300';
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-300';
      case 'error':
        return 'text-red-700 dark:text-red-300';
    }
  };

  return (
    <Alert 
      className={`${alertVariants({ variant })} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className={getTextColor()}>
        {getIcon()}
      </div>
      {title && (
        <AlertTitle className={getTextColor()}>
          {title}
        </AlertTitle>
      )}
      <AlertDescription className={getTextColor()}>
        {children}
      </AlertDescription>
    </Alert>
  );
};