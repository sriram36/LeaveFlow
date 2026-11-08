"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, CalendarDays, ClipboardCheck, FileClock, Github, KeyRound, Lock, MessageSquare, ShieldCheck, Swords, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppDemo } from "@/components/landing/whatsapp-demo";

const REPO_URL = "https://github.com/sriram36/LeaveFlow";

const STEPS = [
  {
    icon: MessageSquare,
    title: "An employee sends a message",
    body: "“leave tomorrow sick” is enough. A rule-based parser reads dates and leave type, with an optional LLM fallback for messier wording.",
  },
  {
    icon: ClipboardCheck,
    title: "The request is checked",
    body: "Weekends and holidays are skipped, overlapping requests are refused, and the balance is reserved in the same transaction that creates the request.",
  },
  {
    icon: Users,
    title: "A manager decides",
    body: "The request appears on the dashboard live over WebSockets. Managers can only act on their own team; the employee gets the answer on WhatsApp.",
  },
];

const TRUST = [
  {
    icon: Swords,
    title: "Two approvers can’t both win",
    body: "Approve, reject and cancel are conditional database updates. The loser gets “already processed” and a refund only ever happens once.",
  },
  {
    icon: Lock,
    title: "Balances can’t be overdrawn",
    body: "Deduction is a single UPDATE … WHERE balance >= days, and creating a request locks the user’s balance row until it commits.",
  },
  {
    icon: FileClock,
    title: "Every action is logged",
    body: "Creating, approving, rejecting and cancelling each write an audit-log entry in the same transaction as the change.",
  },
  {
    icon: KeyRound,
    title: "Role-based access",
    body: "Worker, manager, HR and admin roles. Sessions use an HttpOnly cookie, and login is rate limited.",
  },
  {
    icon: ShieldCheck,
    title: "Signed webhooks",
    body: "Incoming WhatsApp events are verified with an HMAC-SHA256 signature when an app secret is configured.",
  },
  {
    icon: ClipboardCheck,
    title: "Tested against real Postgres",
    body: "60+ automated tests, including concurrency tests that run in CI against a PostgreSQL service container.",
  },
];

export function LandingPage() {
  // The backend may be asleep. Poke it in the background so it is awake by the time someone clicks "demo".
  useEffect(() => {
    const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
    fetch(api, { mode: "no-cors" }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarDays className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">LeaveFlow</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <a href="#how" className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:block">How it works</a>
          <a href="#trust" className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:block">Under the hood</a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:flex">
            <Github className="h-4 w-4" /> Source
          </a>
          <Button asChild size="sm" variant="outline">
            <Link href="/signin">Sign in</Link>
          </Button>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:pt-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 top-0 -z-10 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl"
          />
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> WhatsApp in, live dashboard out
            </p>
            <h1 className="font-serif text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Leave requests that start as a <span className="italic text-primary">text message.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Employees ask on WhatsApp. Managers approve from a live dashboard. Balances, overlaps and weekends are checked automatically,
              and two approvers can never both win.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="px-7">
                <Link href="/signin?demo=1">
                  Try the live demo <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-7">
                <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                  <Github className="h-5 w-5" /> View the code
                </a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">One click signs you in to the shared demo account. The first load can take a moment while the server wakes up.</p>
          </div>

          <WhatsAppDemo />
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-border bg-card/60 py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">How it works</p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl font-semibold tracking-tight sm:text-4xl">From a message to a decision in three steps.</h2>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative">
                  <span className="font-serif text-5xl font-semibold text-primary/25">{String(i + 1).padStart(2, "0")}</span>
                  <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-10 text-sm text-muted-foreground">Employees use WhatsApp; the dashboard is for managers, HR and admins.</p>
          </div>
        </section>

        {/* Trust */}
        <section id="trust" className="py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Under the hood</p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Boring where it matters: HR data has to be right.</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">Each point below is implemented and covered in the repository, not a roadmap item.</p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TRUST.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="px-5 pb-20 sm:px-8">
          <div className="mx-auto max-w-6xl rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground">
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">See the real dashboard.</h2>
            <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">One click signs you in to the shared demo account. It is a live app, so expect test data.</p>
            <Button asChild size="lg" className="mt-7 bg-background px-7 text-foreground hover:bg-background/90">
              <Link href="/signin?demo=1">
                Try the live demo <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:px-8">
          <p>A portfolio project by sriram36. Not a commercial product, and no real customers.</p>
          <div className="flex items-center gap-5">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a>
            <Link href="/signin" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
