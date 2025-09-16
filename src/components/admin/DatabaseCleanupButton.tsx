import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { CleanupModal } from "@/components/admin/CleanupModal";

interface DatabaseCleanupButtonProps {
  className?: string;
}

export function DatabaseCleanupButton({ className }: DatabaseCleanupButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        variant="outline"
        size="sm"
        className={className}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Limpar Base
      </Button>

      <CleanupModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />
    </>
  );
}