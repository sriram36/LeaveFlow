"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Check, CheckCheck, CircleCheck, Clock, RotateCcw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Scripted, looping preview of the product: an employee texts the bot and the
 * manager's card updates. Nothing here is live data. Users see the final frame
 * without animation when they prefer reduced motion.
 */

const STEP_DELAYS = [700, 1100, 1300, 1400, 1700, 1500, 4200]; // ms before moving to the next step
const LAST_STEP = STEP_DELAYS.length;

export function WhatsAppDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(LAST_STEP - 1);
      return;
    }
    const timer = setTimeout(
      () => setStep((s) => (s >= LAST_STEP ? 0 : s + 1)),
      STEP_DELAYS[Math.min(step, LAST_STEP - 1)]
    );
    return () => clearTimeout(timer);
  }, [step]);

  const approved = step >= 5;

  return (
    <MotionConfig reducedMotion="user">
    <div className="relative mx-auto grid w-full max-w-[640px] gap-5 md:grid-cols-[240px_1fr] md:items-center">
      {/* Employee's phone */}
      <div
        className="relative mx-auto w-full max-w-[260px] overflow-hidden rounded-[28px] border border-black/10 bg-[#ECE5DD] shadow-[0_24px_60px_-20px_rgba(7,60,55,0.45)]"
        aria-label="Example WhatsApp conversation"
      >
        <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">L</div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">LeaveFlow bot</p>
            <p className="text-[11px] text-white/70">online</p>
          </div>
        </div>

        <div className="flex min-h-[290px] flex-col justify-end gap-2 px-3 py-4 text-[13px] text-[#111B21]">
          <AnimatePresence initial={false}>
            {step >= 1 && (
              <Bubble key="u1" from="user">
                leave tomorrow sick
              </Bubble>
            )}
            {step === 2 && (
              <Bubble key="typing" from="bot">
                <span className="inline-flex gap-1 py-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-black/40" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </span>
              </Bubble>
            )}
            {step >= 3 && (
              <Bubble key="b1" from="bot">
                Sick leave · tomorrow · 1 day. Balance and overlaps checked.
              </Bubble>
            )}
            {step >= 4 && (
              <Bubble key="b2" from="bot">
                Sent to your manager for approval.
              </Bubble>
            )}
            {approved && (
              <Bubble key="b3" from="bot">
                Approved. Get well soon.
              </Bubble>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Manager's dashboard card */}
      <div className="min-h-[250px]">
        <AnimatePresence mode="wait">
          {step >= 4 ? (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-border bg-card p-5 shadow-[0_18px_50px_-24px_rgba(7,60,55,0.35)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Manager dashboard</p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
                    approved ? "bg-success/15 text-success" : "bg-warning/15 text-[hsl(30_70%_28%)] dark:text-warning"
                  )}
                >
                  {approved ? <CircleCheck className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  {approved ? "Approved" : "Pending"}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-muted text-sm font-semibold text-primary">AR</div>
                <div>
                  <p className="font-semibold leading-tight text-foreground">Asha Rao</p>
                  <p className="text-sm text-muted-foreground">Sick leave · tomorrow · 1 day</p>
                </div>
              </div>

              <ul className="mt-4 space-y-1.5 rounded-xl bg-muted/70 p-3 text-sm">
                {["Balance after approval: 7 days", "No overlapping request", "1 teammate off that day"].map((line) => (
                  <li key={line} className="flex items-center gap-2 text-foreground/90">
                    <Check className="h-4 w-4 text-success" /> {line}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex gap-2">
                <div
                  className={cn(
                    "flex h-9 flex-1 items-center justify-center rounded-lg text-sm font-semibold transition-all duration-300",
                    approved ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
                  )}
                >
                  {approved ? (
                    <span className="inline-flex items-center gap-1.5"><CheckCheck className="h-4 w-4" /> Approved</span>
                  ) : (
                    "Approve"
                  )}
                </div>
                <div className="flex h-9 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground">
                  Reject
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-[250px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground"
            >
              <ShieldCheck className="h-5 w-5" />
              Waiting for a request…
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="flex items-center justify-center gap-3 text-center text-xs text-muted-foreground md:col-span-2">
        Scripted preview with sample data, not a live conversation.
        <button
          type="button"
          onClick={() => setStep(0)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw className="h-3 w-3" /> Replay
        </button>
      </p>
    </div>
    </MotionConfig>
  );
}

function Bubble({ from, children }: { from: "user" | "bot"; children: React.ReactNode }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "max-w-[85%] rounded-lg px-2.5 py-1.5 leading-snug shadow-sm",
        from === "user" ? "self-end rounded-tr-none bg-[#D9FDD3]" : "self-start rounded-tl-none bg-white"
      )}
    >
      {children}
    </motion.div>
  );
}
