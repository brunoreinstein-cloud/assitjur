import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface UsageData {
  date: string;
  requests: number;
  tokens_in: number;
  tokens_out: number;
  cost_cents: number;
}

interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
}

interface ComarcaRisk {
  comarca: string;
  avgRisk: number;
  count: number;
  highRiskCount: number;
}

interface AnalyticsChartsProps {
  usageData?: UsageData[];
  riskDistribution?: RiskDistribution;
  comarcaRisks?: ComarcaRisk[];
  loading?: boolean;
}

const RISK_COLORS = {
  low: '#10b981',    // green-500
  medium: '#f59e0b', // amber-500
  high: '#ef4444'    // red-500
};

const chartConfig = {
  requests: {
    label: "Consultas",
    color: "hsl(var(--chart-1))",
  },
  cost_cents: {
    label: "Custo (centavos)",
    color: "hsl(var(--chart-2))",
  },
  tokens_in: {
    label: "Tokens Entrada",
    color: "hsl(var(--chart-3))",
  },
  tokens_out: {
    label: "Tokens Saída",
    color: "hsl(var(--chart-4))",
  },
  avgRisk: {
    label: "Risco Médio",
    color: "hsl(var(--chart-5))",
  }
};

export const UsageChart: React.FC<{ data: UsageData[] }> = ({ data }) => {
  if (!data?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Uso da API OpenAI</CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso da API OpenAI</CardTitle>
        <CardDescription>Consultas e custos por dia</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="requests"
              stackId="1"
              stroke="var(--color-requests)"
              fill="var(--color-requests)"
              fillOpacity={0.6}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="cost_cents"
              stackId="2"
              stroke="var(--color-cost_cents)"
              fill="var(--color-cost_cents)"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export const RiskDistributionChart: React.FC<{ data: RiskDistribution }> = ({ data }) => {
  const pieData = [
    { name: 'Baixo Risco', value: data.low, color: RISK_COLORS.low },
    { name: 'Médio Risco', value: data.medium, color: RISK_COLORS.medium },
    { name: 'Alto Risco', value: data.high, color: RISK_COLORS.high },
  ].filter(item => item.value > 0);

  if (pieData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Riscos</CardTitle>
          <CardDescription>Classificação dos processos por nível de risco</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum processo com score de risco
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Riscos</CardTitle>
        <CardDescription>Classificação dos processos por nível de risco</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-3 w-3 rounded-full" 
                              style={{ backgroundColor: data.payload.color }}
                            />
                            <span className="font-medium">{data.payload.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {data.value} processos ({((Number(data.value) / (pieData.reduce((sum, item) => sum + item.value, 0) || 1)) * 100).toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const ComarcaRiskChart: React.FC<{ data: ComarcaRisk[] }> = ({ data }) => {
  if (!data?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risco por Comarca</CardTitle>
          <CardDescription>Top 10 comarcas com maior risco médio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado de comarca disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risco por Comarca</CardTitle>
        <CardDescription>Top 10 comarcas com maior risco médio</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <BarChart data={data} layout="horizontal" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 10]} />
            <YAxis 
              type="category" 
              dataKey="comarca" 
              width={100}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                      <div className="grid gap-2">
                        <div className="font-medium">{label}</div>
                        <div className="text-sm">
                          <div>Risco Médio: <span className="font-mono">{data.avgRisk.toFixed(1)}</span></div>
                          <div>Total Processos: <span className="font-mono">{data.count}</span></div>
                          <div>Alto Risco: <span className="font-mono">{data.highRiskCount}</span></div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="avgRisk" 
              fill="var(--color-avgRisk)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export const TokensChart: React.FC<{ data: UsageData[] }> = ({ data }) => {
  if (!data?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Uso de Tokens</CardTitle>
          <CardDescription>Tokens de entrada e saída por dia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso de Tokens</CardTitle>
        <CardDescription>Tokens de entrada e saída por dia</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
            />
            <YAxis />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
            />
            <Line 
              type="monotone" 
              dataKey="tokens_in" 
              stroke="var(--color-tokens_in)" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="tokens_out" 
              stroke="var(--color-tokens_out)" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};