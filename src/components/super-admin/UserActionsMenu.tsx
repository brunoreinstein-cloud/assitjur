import { useState } from 'react';
import { MoreVertical, KeyRound, Building2, UserX, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { TransferUserDialog } from './TransferUserDialog';

interface UserActionsMenuProps {
  user: {
    user_id: string;
    email: string;
    full_name: string | null;
    organization_name: string | null;
    is_active: boolean;
  };
  onSuccess: () => void;
}

export function UserActionsMenu({ user, onSuccess }: UserActionsMenuProps) {
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [transferUserOpen, setTransferUserOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações do Usuário</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setResetPasswordOpen(true)}>
            <KeyRound className="mr-2 h-4 w-4" />
            Resetar Senha
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setTransferUserOpen(true)}>
            <Building2 className="mr-2 h-4 w-4" />
            Transferir Organização
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem disabled>
            {user.is_active ? (
              <>
                <UserX className="mr-2 h-4 w-4" />
                Desativar Usuário
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Ativar Usuário
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResetPasswordDialog
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
        user={user}
        onSuccess={onSuccess}
      />

      <TransferUserDialog
        open={transferUserOpen}
        onOpenChange={setTransferUserOpen}
        user={user}
        onSuccess={onSuccess}
      />
    </>
  );
}
