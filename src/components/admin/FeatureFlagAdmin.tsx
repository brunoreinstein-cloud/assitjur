import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface FeatureFlag {
  id?: string;
  flag: string;
  enabled: boolean;
  rollout_percentage: number;
  environment: string;
}

interface AuditEntry {
  id: string;
  action: string;
  old_value: unknown;
  new_value: unknown;
  timestamp: string;
}

const envs = ["development", "staging", "production"];

export const FeatureFlagAdmin: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [current, setCurrent] = useState<FeatureFlag>({
    flag: "",
    enabled: true,
    rollout_percentage: 100,
    environment: "development",
  });
  const [editing, setEditing] = useState<FeatureFlag | null>(null);
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [killed, setKilled] = useState<string[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();
  const tenantId = profile?.organization_id;

  useEffect(() => {
    fetchFlags();
  }, []);

  useEffect(() => {
    fetchKilled();
  }, [tenantId]);

  const fetchFlags = async () => {
    // Mock data since feature_flags table doesn't exist yet
    const mockFlags: FeatureFlag[] = [
      {
        id: "1",
        flag: "advanced-search",
        enabled: true,
        rollout_percentage: 100,
        environment: "development",
      },
      {
        id: "2",
        flag: "beta-features",
        enabled: false,
        rollout_percentage: 50,
        environment: "staging",
      },
    ];
    setFlags(mockFlags);
  };

  const fetchKilled = async () => {
    if (!tenantId) return;
    // Mock empty killed flags for now
    setKilled([]);
  };

  const fetchAudit = async (_flagId?: string) => {
    // Mock audit data since audit table doesn't exist yet
    const mockAudits: AuditEntry[] = [
      {
        id: "1",
        action: "created",
        old_value: null,
        new_value: { enabled: true },
        timestamp: new Date().toISOString(),
      },
      {
        id: "2",
        action: "updated",
        old_value: { enabled: true },
        new_value: { enabled: false },
        timestamp: new Date().toISOString(),
      },
    ];
    setAudits(mockAudits);
  };

  const startEdit = (flag: FeatureFlag) => {
    setEditing(flag);
    setCurrent({ ...flag });
    fetchAudit(flag.id!);
  };

  const handleField = (field: keyof FeatureFlag, value: unknown) => {
    setCurrent((c) => ({ ...c, [field]: value }));
  };

  const quickSet = (value: number) => handleField("rollout_percentage", value);

  const diff = (oldFlag: FeatureFlag | null, newFlag: FeatureFlag) => {
    return JSON.stringify({ old: oldFlag, new: newFlag }, null, 2);
  };

  const save = async () => {
    if (!current.flag) return;
    const confirmation = window.confirm(diff(editing, current));
    if (!confirmation) return;
    try {
      const { error } = await supabase.functions.invoke("feature-flag-admin", {
        body: { action: "save", flag: current },
      });
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Flag salva com sucesso",
      });
      await fetchFlags();
      setEditing(null);
      setCurrent({
        flag: "",
        enabled: true,
        rollout_percentage: 100,
        environment: "development",
      });
    } catch (e: unknown) {
      if (e && typeof e === 'object' && ('status' in e) && (e.status === 401 || e.status === 403)) {
        toast({
          title: "Erro",
          description: "Acesso negado",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao salvar flag",
          variant: "destructive",
        });
      }
    }
  };

  const clone = async (env: string) => {
    if (!editing?.id) return;
    try {
      const { error } = await supabase.functions.invoke("feature-flag-admin", {
        body: { action: "clone", flag_id: editing.id, target_env: env },
      });
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Flag clonada com sucesso",
      });
      fetchFlags();
    } catch (e: unknown) {
      if (e && typeof e === 'object' && ('status' in e) && (e.status === 401 || e.status === 403)) {
        toast({
          title: "Erro",
          description: "Acesso negado",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao clonar flag",
          variant: "destructive",
        });
      }
    }
  };

  const toggleKill = async (flagId: string) => {
    if (!tenantId) return;
    const next = killed.includes(flagId)
      ? killed.filter((id) => id !== flagId)
      : [...killed, flagId];
    try {
      // Mock update since platform_settings table doesn't exist yet
      setKilled(next);
      toast({
        title: "Sucesso",
        description: "Kill switch atualizado com sucesso",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Erro ao atualizar kill switch",
        variant: "destructive",
      });
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
            <Button
              key={f.id}
              variant={editing?.id === f.id ? "secondary" : "outline"}
              onClick={() => startEdit(f)}
            >
              {f.flag}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <Input
            placeholder="flag name"
            value={current.flag}
            onChange={(e) => handleField("flag", e.target.value)}
          />
          <Select
            value={current.environment}
            onValueChange={(v) => handleField("environment", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="environment" />
            </SelectTrigger>
            <SelectContent>
              {envs.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={current.rollout_percentage}
              onChange={(e) =>
                handleField("rollout_percentage", Number(e.target.value))
              }
            />
            <div className="flex gap-1">
              {[10, 25, 50, 100].map((p) => (
                <Button key={p} type="button" onClick={() => quickSet(p)}>
                  {p}%
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={current.enabled}
              onCheckedChange={(v) => handleField("enabled", v)}
            />
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
              {envs
                .filter((e) => e !== editing.environment)
                .map((env) => (
                  <Button key={env} onClick={() => clone(env)}>
                    {env}
                  </Button>
                ))}
            </div>
          </div>
        )}

        {audits.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold">Audit</h3>
            <ul className="list-disc pl-4">
              {audits.map((a) => (
                <li key={a.id}>
                  {a.action} - {a.timestamp}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeatureFlagAdmin;
