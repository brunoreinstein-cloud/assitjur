import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';

interface MetricRow {
  flag_id: string;
  window: string; // '7d' | '30d'
  evaluations_count: number;
  unique_users: number;
  last_evaluated: string;
}

const FeatureFlagMetrics: React.FC = () => {
  const [rows, setRows] = useState<MetricRow[]>([]);

  useEffect(() => {
    supabase
      .from('feature_flag_metrics')
      .select('*')
      .then(({ data, error }) => {
        if (!error && data) {
          setRows(data as MetricRow[]);
        }
      });
  }, []);

  const chartData = useMemo(() => {
    const byFlag: Record<string, { flag_id: string; eval_7d: number; eval_30d: number }> = {};
    for (const r of rows) {
      if (!byFlag[r.flag_id]) {
        byFlag[r.flag_id] = { flag_id: r.flag_id, eval_7d: 0, eval_30d: 0 };
      }
      if (r.window === '7d') byFlag[r.flag_id].eval_7d = r.evaluations_count;
      if (r.window === '30d') byFlag[r.flag_id].eval_30d = r.evaluations_count;
    }
    return Object.values(byFlag);
  }, [rows]);

  const total7d = rows
    .filter((r) => r.window === '7d')
    .reduce((sum, r) => sum + r.evaluations_count, 0);
  const total30d = rows
    .filter((r) => r.window === '30d')
    .reduce((sum, r) => sum + r.evaluations_count, 0);
  const users30d = rows
    .filter((r) => r.window === '30d')
    .reduce((sum, r) => sum + r.unique_users, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Avaliações 7d</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{total7d}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avaliações 30d</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{total30d}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Usuários únicos 30d</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{users30d}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Avaliações por Flag</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            className="h-[300px]"
            config={{
              eval_7d: { label: '7d', color: 'hsl(var(--chart-1))' },
              eval_30d: { label: '30d', color: 'hsl(var(--chart-2))' },
            }}
          >
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="flag_id" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="eval_7d" fill="var(--color-eval_7d)" />
              <Bar dataKey="eval_30d" fill="var(--color-eval_30d)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureFlagMetrics;
