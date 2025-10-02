import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Phone, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AvatarUpload } from './AvatarUpload';
import { useProfile } from '@/hooks/useProfile';
import { personalInfoSchema, type PersonalInfo } from '@/lib/validation-schemas';

export function PersonalInfoTab() {
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
    values: {
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      job_title: profile?.job_title || '',
    },
  });

  const onSubmit = async (data: PersonalInfo) => {
    setIsSubmitting(true);
    try {
      await updateProfile.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpload = (file: File) => {
    uploadAvatar.mutate(file);
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      const parts = profile.full_name.split(' ');
      return parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : parts[0][0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Foto de Perfil</h3>
        <AvatarUpload
          currentAvatarUrl={profile?.avatar_url}
          userInitials={getUserInitials()}
          onUpload={handleAvatarUpload}
          isUploading={uploadAvatar.isPending}
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Informações Pessoais</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="full_name"
                {...register('full_name')}
                placeholder="João da Silva"
                className="pl-10"
              />
            </div>
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="joao@exemplo.com"
                className="pl-10"
                disabled
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Email não pode ser alterado
            </p>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                {...register('phone')}
                placeholder="(11) 98765-4321"
                className="pl-10"
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_title">Cargo</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="job_title"
                {...register('job_title')}
                placeholder="Advogado"
                className="pl-10"
              />
            </div>
            {errors.job_title && (
              <p className="text-sm text-destructive">{errors.job_title.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="submit"
              disabled={!isDirty || isSubmitting}
              loading={isSubmitting}
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
