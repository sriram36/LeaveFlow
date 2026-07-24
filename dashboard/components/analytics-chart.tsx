"use client";

import { useTheme } from "next-themes";
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
  const isDark = theme === "dark";
  
  const colors = {
    grid: isDark ? "#334155" : "#e2e8f0",
    text: isDark ? "#94a3b8" : "#64748b",
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-xl border border-border/50 p-4 rounded-xl shadow-xl shadow-black/5">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
                <span className="font-medium text-foreground">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full h-full border-border/50 bg-background/50 backdrop-blur-xl shadow-sm hover:shadow-lg transition-all duration-300 group">
      <CardHeader>
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Leave Trends
        </CardTitle>
        <CardDescription className="text-muted-foreground font-medium">
          Monthly distribution across the team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSick" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDark ? "#8b5cf6" : "#8b5cf6"} stopOpacity={0.9}/>
                  <stop offset="95%" stopColor={isDark ? "#6d28d9" : "#a855f7"} stopOpacity={0.7}/>
                </linearGradient>
                <linearGradient id="colorCasual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDark ? "#38bdf8" : "#0ea5e9"} stopOpacity={0.9}/>
                  <stop offset="95%" stopColor={isDark ? "#0284c7" : "#38bdf8"} stopOpacity={0.7}/>
                </linearGradient>
                <linearGradient id="colorSpecial" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDark ? "#f472b6" : "#ec4899"} stopOpacity={0.9}/>
                  <stop offset="95%" stopColor={isDark ? "#db2777" : "#f472b6"} stopOpacity={0.7}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} opacity={0.5} />
              <XAxis dataKey="name" stroke={colors.text} fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke={colors.text} fontSize={12} tickLine={false} axisLine={false} dx={-10} />
              <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }} content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px', fontWeight: 500 }} />
              <Bar dataKey="Sick" stackId="a" fill="url(#colorSick)" radius={[0, 0, 4, 4]} />
              <Bar dataKey="Casual" stackId="a" fill="url(#colorCasual)" />
              <Bar dataKey="Special" stackId="a" fill="url(#colorSpecial)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
