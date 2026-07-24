"use client";

import { useTheme } from "@/components/theme-provider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyTrend } from "@/app/lib/api";

interface AnalyticsChartProps {
  data: MonthlyTrend[];
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  const { theme } = useTheme();
  
  const colors = {
    Sick: theme === "dark" ? "#60a5fa" : "#3b82f6",     // blue-400 / blue-500
    Casual: theme === "dark" ? "#34d399" : "#10b981",   // emerald-400 / emerald-500
    Special: theme === "dark" ? "#c084fc" : "#a855f7",  // purple-400 / purple-500
    grid: theme === "dark" ? "#334155" : "#e2e8f0",     // slate-700 / slate-200
    text: theme === "dark" ? "#94a3b8" : "#64748b",     // slate-400 / slate-500
  };

  return (
    <Card className="w-full h-full shadow-glass hover-lift border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-gradient">Leave Trends Overview</CardTitle>
        <CardDescription>Monthly distribution of leave types across the team</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
              <XAxis dataKey="name" stroke={colors.text} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={colors.text} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f1f5f9' }}
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                  borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              <Bar dataKey="Sick" stackId="a" fill={colors.Sick} radius={[0, 0, 4, 4]} />
              <Bar dataKey="Casual" stackId="a" fill={colors.Casual} />
              <Bar dataKey="Special" stackId="a" fill={colors.Special} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
