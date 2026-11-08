"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/app/lib/format";
import { cn } from "@/lib/utils";

interface ParseResult {
  command: string;
  leave_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  half_day_period?: string | null;
  reason?: string | null;
  request_id?: number | null;
  error?: string | null;
}

const COMMAND_LABEL: Record<string, string> = {
  leave: "Leave request",
  half_leave: "Half-day leave",
  balance: "Balance check",
  status: "Status check",
  cancel: "Cancel a request",
  approve: "Manager: approve",
  reject: "Manager: reject",
  pending: "List pending requests",
  team_today: "Who is away today",
  unknown: "Not understood",
};

const EXAMPLES = [
  "leave tomorrow sick",
  "leave 12 Feb to 15 Feb casual wedding",
  "half leave tomorrow morning",
  "balance",
  "cancel 32",
  "leave next monday casual",
];

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

type State =
  | { kind: "idle" }
  | { kind: "loading"; waking: boolean }
  | { kind: "done"; message: string; result: ParseResult }
  | { kind: "unreachable" };

/**
 * Sends the text to the real parser on the server (POST /demo/parse) and shows what it understood.
 * Nothing is stored. The last example is one the parser cannot handle on purpose.
 */
export function ParserPlayground() {
  const [text, setText] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const wakingTimer = useRef<ReturnType<typeof setTimeout>>();
  const abort = useRef<AbortController>();

  useEffect(() => () => {
    clearTimeout(wakingTimer.current);
    abort.current?.abort();
  }, []);

  const run = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    clearTimeout(wakingTimer.current);

    setText(trimmed);
    setState({ kind: "loading", waking: false });
    // On a free-tier host the first request can take a while; say so instead of looking broken.
    wakingTimer.current = setTimeout(() => setState({ kind: "loading", waking: true }), 2500);
    const giveUp = setTimeout(() => controller.abort(), 45_000);

    try {
      const response = await fetch(`${API}/demo/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(String(response.status));
      setState({ kind: "done", message: trimmed, result: await response.json() });
    } catch (error) {
      // A newer request replaced this one: leave its state alone.
      if (abort.current !== controller) return;
      setState({ kind: "unreachable" });
    } finally {
      clearTimeout(giveUp);
      clearTimeout(wakingTimer.current);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    run(text);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5 sm:p-8">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="parser-input" className="sr-only">
          A leave message
        </label>
        <input
          id="parser-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          placeholder="leave tomorrow sick"
          autoComplete="off"
          className="h-12 flex-1 rounded-xl border border-input bg-background px-4 font-mono text-[15px] focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" size="lg" disabled={!text.trim() || state.kind === "loading"}>
          Parse it <ArrowRight className="h-5 w-5" />
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Examples">
        {EXAMPLES.map((example, i) => (
          <button
            key={example}
            type="button"
            onClick={() => run(example)}
            className={cn(
              "rounded-full border px-3 py-1.5 font-mono text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              i === EXAMPLES.length - 1 ? "border-dashed border-muted-foreground/60 text-muted-foreground" : "border-border"
            )}
            title={i === EXAMPLES.length - 1 ? "A phrasing the parser does not handle" : undefined}
          >
            {example}
          </button>
        ))}
      </div>

      <div className="mt-6 min-h-[168px] rounded-2xl bg-muted/60 p-5" aria-live="polite" data-testid="parser-result">
        {state.kind === "idle" && (
          <p className="text-sm text-muted-foreground">
            Pick an example or type your own. The text goes to the real parser on the server, and you see exactly what it understood.
          </p>
        )}

        {state.kind === "loading" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {state.waking ? "Waking the demo server (it sleeps when idle), one moment…" : "Parsing…"}
          </p>
        )}

        {state.kind === "unreachable" && (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            The demo server did not answer. It may still be waking up, so try again in a few seconds.
          </p>
        )}

        {state.kind === "done" && <ResultView message={state.message} result={state.result} />}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Runs <code className="rounded bg-muted px-1 py-0.5">POST /demo/parse</code> on the backend. Rule-based, so it understands formats like these;
        unusual phrasing gets an error. Nothing is saved.
      </p>
    </div>
  );
}

function ResultView({ message, result }: { message: string; result: ParseResult }) {
  const understood = result.command !== "unknown" && !result.error;
  const rows: [string, string][] = [];
  if (result.leave_type) rows.push(["Type", `${result.leave_type[0].toUpperCase()}${result.leave_type.slice(1)} leave`]);
  if (result.start_date && result.end_date) rows.push(["Dates", formatDateRange(result.start_date, result.end_date)]);
  if (result.half_day_period) rows.push(["Half day", result.half_day_period]);
  if (result.reason) rows.push(["Reason", result.reason]);
  if (result.request_id != null) rows.push(["Request", `#${result.request_id}`]);

  return (
    <div>
      <p className="font-mono text-xs text-muted-foreground">“{message}”</p>
      <p className={cn("mt-2 flex items-center gap-2 text-lg font-semibold", understood ? "text-foreground" : "text-[hsl(30_80%_28%)] dark:text-warning")}>
        {understood ? <CircleCheck className="h-5 w-5 text-success" /> : <CircleAlert className="h-5 w-5" />}
        {understood
          ? COMMAND_LABEL[result.command] ?? result.command
          : result.command === "unknown"
          ? COMMAND_LABEL.unknown
          : `${COMMAND_LABEL[result.command] ?? result.command}, but something is missing`}
      </p>
      {rows.length > 0 && (
        <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex gap-3">
              <dt className="w-16 shrink-0 text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {result.error && <p className="mt-3 text-sm text-muted-foreground">{result.error}</p>}
    </div>
  );
}
