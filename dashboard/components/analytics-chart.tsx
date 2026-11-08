"use client";

import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyTrend } from "@/app/lib/api";

// Colours come from the theme variables, so light, dark and "system" all just work.
const SICK = "hsl(var(--chart-5))";
const CASUAL = "hsl(var(--chart-1))";
const SPECIAL = "hsl(var(--chart-4))";
const AXIS = "hsl(var(--muted-foreground))";
const GRID = "hsl(var(--border))";

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-sm shadow-lg">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsChart({ data }: { data: MonthlyTrend[] }) {
  const empty = data.every((m) => !m.Sick && !m.Casual && !m.Special);
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Leave usage</CardTitle>
        <CardDescription>Approved requests per month, by type (last 6 months)</CardDescription>
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">No leave recorded yet.</p>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
                <XAxis dataKey="name" stroke={AXIS} fontSize={12} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke={AXIS} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="Casual" stackId="a" fill={CASUAL} />
                <Bar dataKey="Sick" stackId="a" fill={SICK} />
                <Bar dataKey="Special" stackId="a" fill={SPECIAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
