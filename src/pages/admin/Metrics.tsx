import { useEffect, useState } from 'react';
import { analyticsAllowed } from '@/middleware/consent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SummaryRow {
  event: string;
  count: number;
}

const Metrics = () => {
  const [start, setStart] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<SummaryRow[]>([]);

  const fetchData = async () => {
    if (!(await analyticsAllowed())) return;
    // Mock analytics call since analytics_events_summary function doesn't exist yet
    const mockData = [
      { event: 'page_view', count: 150, unique_users: 45 },
      { event: 'button_click', count: 300, unique_users: 80 }
    ];
    setRows(mockData as SummaryRow[]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          <Button onClick={fetchData}>Refresh</Button>
        </div>
        <ul>
          {rows.map((r) => (
            <li key={r.event} className="py-1">{r.event}: {r.count}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default Metrics;
