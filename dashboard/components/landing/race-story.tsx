import { Check, Info } from "lucide-react";

/**
 * The concurrency guarantee as a picture. The two panels mirror what the test
 * `test_concurrent_approvals_only_one_wins` does and the message the dashboard shows.
 */
export function RaceStory() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Lane who="Meera Nair" role="Manager" time="t = 0 ms">
        <div className="flex h-10 items-center justify-center gap-2 rounded-lg bg-success text-sm font-semibold text-success-foreground">
          <Check className="h-4 w-4" /> Approved
        </div>
        <p className="mt-3 text-sm text-muted-foreground">The conditional update finds the request still pending and changes it. The audit entry is written in the same transaction.</p>
      </Lane>

      <Lane who="Karan Mehta" role="HR" time="t = 0 ms, same instant">
        <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(30_80%_28%)] dark:text-warning" />
          <div>
            <p className="font-semibold">Someone got there first</p>
            <p className="text-muted-foreground">Request is already approved</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">The same update matches zero rows, so nothing changes, nothing is refunded twice, and the dashboard says so.</p>
      </Lane>
    </div>
  );
}

function Lane({ who, role, time, children }: { who: string; role: string; time: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{who}</p>
          <p className="text-xs text-muted-foreground">{role} clicks Approve</p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">{time}</span>
      </div>
      {children}
    </div>
  );
}
