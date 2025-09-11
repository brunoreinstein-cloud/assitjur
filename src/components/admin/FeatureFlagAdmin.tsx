import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface FeatureFlag {
  id?: string;
  flag: string;
  enabled: boolean;
  percentage: number;
  environment: string;
}

interface AuditEntry {
  id: string;
  action: string;
  old_value: any;
  new_value: any;
  timestamp: string;
}

const envs = ['development', 'staging', 'production'];

export const FeatureFlagAdmin: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [current, setCurrent] = useState<FeatureFlag>({ flag: '', enabled: true, percentage: 100, environment: 'development' });
  const [editing, setEditing] = useState<FeatureFlag | null>(null);
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [killed, setKilled] = useState<string[]>([]);
  const { profile } = useAuth();
  const tenantId = profile?.organization_id;

  useEffect(() => {
    fetchFlags();
  }, []);

  useEffect(() => {
    fetchKilled();
  }, [tenantId]);

  const fetchFlags = async () => {
    const { data } = await supabase
      .from('feature_flags')
      .select('*')
      .order('flag');
    setFlags(data as FeatureFlag[] || []);
  };

  const fetchKilled = async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from('platform_settings')
      .select('value_jsonb')
      .eq('tenant_id', tenantId)
      .eq('key', 'emergency_kill')
      .maybeSingle();
    setKilled(Array.isArray(data?.value_jsonb) ? data.value_jsonb : []);
  };

  const fetchAudit = async (flagId: string) => {
    const { data } = await supabase
      .from('feature_flag_audit')
      .select('*')
      .eq('flag_id', flagId)
      .order('timestamp', { ascending: false });
    setAudits(data as AuditEntry[] || []);
  };

  const startEdit = (flag: FeatureFlag) => {
    setEditing(flag);
    setCurrent({ ...flag });
    fetchAudit(flag.id!);
  };

  const handleField = (field: keyof FeatureFlag, value: any) => {
    setCurrent((c) => ({ ...c, [field]: value }));
  };

  const quickSet = (value: number) => handleField('percentage', value);

  const diff = (oldFlag: FeatureFlag | null, newFlag: FeatureFlag) => {
    return JSON.stringify({ old: oldFlag, new: newFlag }, null, 2);
  };

  const save = async () => {
    if (!current.flag) return;
    const confirmation = window.confirm(diff(editing, current));
    if (!confirmation) return;
    try {
      const { error } = await supabase.functions.invoke('feature-flag-admin', {
        body: { action: 'save', flag: current }
      });
      if (error) throw error;
      toast.success('Flag salva');
      await fetchFlags();
      setEditing(null);
      setCurrent({ flag: '', enabled: true, percentage: 100, environment: 'development' });
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) {
        toast.error('Acesso negado');
      } else {
        toast.error('Erro ao salvar flag');
      }
    }
  };

  const clone = async (env: string) => {
    if (!editing?.id) return;
    try {
      const { error } = await supabase.functions.invoke('feature-flag-admin', {
        body: { action: 'clone', flag_id: editing.id, target_env: env }
      });
      if (error) throw error;
      toast.success('Flag clonada');
      fetchFlags();
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) {
        toast.error('Acesso negado');
      } else {
        toast.error('Erro ao clonar');
      }
    }
  };

  const toggleKill = async (flagId: string) => {
    if (!tenantId) return;
    const next = killed.includes(flagId)
      ? killed.filter((id) => id !== flagId)
      : [...killed, flagId];
    try {
      await supabase
        .from('platform_settings')
        .upsert({ tenant_id: tenantId, key: 'emergency_kill', value_jsonb: next });
      setKilled(next);
      toast.success('Kill switch atualizado');
    } catch {
      toast.error('Erro ao atualizar kill switch');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {flags.map((f) => (
            <Button key={f.id} variant={editing?.id === f.id ? 'secondary' : 'outline'} onClick={() => startEdit(f)}>
              {f.flag}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <Input
            placeholder="flag name"
            value={current.flag}
            onChange={(e) => handleField('flag', e.target.value)}
          />
          <Select value={current.environment} onValueChange={(v) => handleField('environment', v)}>
            <SelectTrigger>
              <SelectValue placeholder="environment" />
            </SelectTrigger>
            <SelectContent>
              {envs.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={current.percentage}
              onChange={(e) => handleField('percentage', Number(e.target.value))}
            />
            <div className="flex gap-1">
              {[10,25,50,100].map(p => (
                <Button key={p} type="button" onClick={() => quickSet(p)}>{p}%</Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={current.enabled} onCheckedChange={(v) => handleField('enabled', v)} />
            <span>Enabled</span>
          </div>
          {editing?.id && (
            <div className="flex items-center gap-2">
              <Switch
                checked={killed.includes(editing.id)}
                onCheckedChange={() => toggleKill(editing.id!)}
              />
              <span>Kill switch</span>
            </div>
          )}
          <Button onClick={save}>Save</Button>
        </div>

        {editing && (
          <div className="space-y-2">
            <h3 className="font-bold">Clone to environment</h3>
            <div className="flex gap-2">
              {envs.filter(e => e !== editing.environment).map(env => (
                <Button key={env} onClick={() => clone(env)}>{env}</Button>
              ))}
            </div>
          </div>
        )}

        {audits.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold">Audit</h3>
            <ul className="list-disc pl-4">
              {audits.map(a => (
                <li key={a.id}>{a.action} - {a.timestamp}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeatureFlagAdmin;

