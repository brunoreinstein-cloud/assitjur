import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, Clock, Palette, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useProfile } from '@/hooks/useProfile';
import { preferencesSchema, type Preferences } from '@/lib/validation-schemas';

export function PreferencesTab() {
  const { profile, updateProfile } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { isDirty },
  } = useForm<Preferences>({
    resolver: zodResolver(preferencesSchema),
    values: {
      language: (profile?.language || 'pt-BR') as 'pt-BR' | 'en-US' | 'es-ES',
      timezone: profile?.timezone || 'America/Sao_Paulo',
      theme_preference: (profile?.theme_preference || 'system') as 'light' | 'dark' | 'system',
      email_notifications: profile?.email_notifications || {
        system_alerts: true,
        weekly_reports: true,
        security_alerts: true,
      },
    },
  });

  const onSubmit = async (data: Preferences) => {
    setIsSubmitting(true);
    try {
      await updateProfile.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formValues = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Idioma e Região</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select
              value={formValues.language}
              onValueChange={(value) => setValue('language', value as any, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es-ES">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fuso Horário</Label>
            <Select
              value={formValues.timezone}
              onValueChange={(value) => setValue('timezone', value, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                <SelectItem value="America/New_York">Nova York (UTC-5)</SelectItem>
                <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tóquio (UTC+9)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Aparência</h3>
        </div>

        <div className="space-y-2">
          <Label>Tema</Label>
          <Select
            value={formValues.theme_preference}
            onValueChange={(value) => setValue('theme_preference', value as any, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Escuro</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Notificações por Email</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="system-alerts">Alertas do Sistema</Label>
              <p className="text-sm text-muted-foreground">
                Notificações importantes sobre sua conta
              </p>
            </div>
            <Switch
              id="system-alerts"
              checked={formValues.email_notifications.system_alerts}
              onCheckedChange={(checked) =>
                setValue('email_notifications.system_alerts', checked, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-reports">Relatórios Semanais</Label>
              <p className="text-sm text-muted-foreground">
                Resumo semanal de atividades
              </p>
            </div>
            <Switch
              id="weekly-reports"
              checked={formValues.email_notifications.weekly_reports}
              onCheckedChange={(checked) =>
                setValue('email_notifications.weekly_reports', checked, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="security-alerts">Alertas de Segurança</Label>
              <p className="text-sm text-muted-foreground">
                Avisos sobre atividades suspeitas
              </p>
            </div>
            <Switch
              id="security-alerts"
              checked={formValues.email_notifications.security_alerts}
              onCheckedChange={(checked) =>
                setValue('email_notifications.security_alerts', checked, { shouldDirty: true })
              }
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={!isDirty || isSubmitting}
          loading={isSubmitting}
        >
          Salvar Preferências
        </Button>
      </div>
    </form>
  );
}
