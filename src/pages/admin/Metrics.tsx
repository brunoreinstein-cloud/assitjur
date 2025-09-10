import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { analyticsAllowed } from '@/middleware/consent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EventRow {
  user_id: string | null;
  event: string;
  ts: string;
}

export default function Metrics() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [ttfv, setTtfv] = useState<number | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!(await analyticsAllowed())) return;
      const { data, error } = await supabase
        .from('analytics_events')
        .select('user_id, event, ts');
      if (error || !data) return;
      const c: Record<string, number> = {};
      const perUser: Record<string, Record<string, string>> = {};
      data.forEach((row: EventRow) => {
        c[row.event] = (c[row.event] || 0) + 1;
        if (row.user_id) {
          perUser[row.user_id] = perUser[row.user_id] || {};
          if (!perUser[row.user_id][row.event]) {
            perUser[row.user_id][row.event] = row.ts;
          }
        }
      });
      setCounts(c);
      const diffs: number[] = [];
      Object.values(perUser).forEach(ev => {
        if (ev.beta_signup && ev.created_first_map) {
          diffs.push(new Date(ev.created_first_map).getTime() - new Date(ev.beta_signup).getTime());
        }
      });
      if (diffs.length) {
        setTtfv(diffs.reduce((a, b) => a + b, 0) / diffs.length);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Métricas</h1>
      <Card>
        <CardHeader>
          <CardTitle>Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-4">
            {Object.entries(counts).map(([event, count]) => (
              <li key={event}>{event}: {count}</li>
            ))}
          </ul>
          {ttfv !== null && (
            <p className="mt-4">TTFV médio: {(ttfv / 1000 / 60).toFixed(2)} minutos</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
