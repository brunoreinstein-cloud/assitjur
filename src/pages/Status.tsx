import { useEffect, useState } from "react";

interface HealthResponse {
  uptime: number;
  [key: string]: any;
}

export default function Status() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    fetch("/api/health")
      .then(async (res) => {
        const data = await res.json();
        setHealth(data);
        setLatency(performance.now() - start);
      })
      .catch(() => setLatency(null));
  }, []);

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-2xl font-bold">Status do Sistema</h1>
      {health && <p>Uptime: {Math.round(health.uptime)}s</p>}
      {latency !== null && <p>Latência: {Math.round(latency)}ms</p>}
    </div>
  );
}
