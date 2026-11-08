"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Who is in today: everyone who is not on approved leave. */
export function TeamAvailability({ total, away }: { total: number; away: number }) {
  const awayCount = Math.min(away, total);
  const working = Math.max(total - awayCount, 0);
  const slices = [
    { name: "Working", value: working, color: "hsl(var(--primary))" },
    { name: "On leave", value: awayCount, color: "hsl(var(--chart-3))" },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Team availability</CardTitle>
        <CardDescription>Today</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No team members yet.</p>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <div className="relative h-[168px] w-[168px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="value"
                    innerRadius={56}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={awayCount > 0 && working > 0 ? 3 : 0}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {slices.map((slice) => (
                      <Cell key={slice.name} fill={slice.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold leading-none">{working}</span>
                <span className="mt-1 text-xs text-muted-foreground">of {total} in</span>
              </div>
            </div>
            <ul className="w-full space-y-2 text-sm" aria-label="Team availability legend">
              {slices.map((slice) => (
                <li key={slice.name} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 whitespace-nowrap text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                    {slice.name}
                  </span>
                  <span className="whitespace-nowrap font-medium">{slice.value === 1 ? "1 person" : `${slice.value} people`}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
