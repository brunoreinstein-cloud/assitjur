import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Lock } from 'lucide-react';
import { PersonalInfoTab } from '@/components/profile/PersonalInfoTab';
import { SecurityTab } from '@/components/profile/SecurityTab';
import { PrivacyTab } from '@/components/profile/PrivacyTab';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';

export default function Profile() {
  const { isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas informações pessoais e preferências individuais
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Pessoal</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Privacidade</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <PersonalInfoTab />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacyTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
