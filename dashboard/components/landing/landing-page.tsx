"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo-mark";
import { SidebarLeaves } from "@/components/brand/sidebar-leaves";
import { WhatsAppDemo } from "@/components/landing/whatsapp-demo";
import { ParserPlayground } from "@/components/landing/parser-playground";
import { ProductTabs } from "@/components/landing/product-tabs";
import { RaceStory } from "@/components/landing/race-story";

const REPO = "https://github.com/sriram36/LeaveFlow";
const blob = (path: string) => `${REPO}/blob/main/${path}`;

const RECEIPTS: { claim: string; detail: string; path: string; file: string }[] = [
  {
    claim: "Balances can't be overdrawn",
    detail: "Deduction is one UPDATE … WHERE balance >= days, and creating a request locks the user's balance row until it commits.",
    path: "backend/app/services/validator.py",
    file: "validator.py",
  },
  {
    claim: "Only one approver wins",
    detail: "Approve, reject and cancel are conditional updates on the request's status; refunds happen once.",
    path: "backend/app/services/leave.py",
    file: "leave.py",
  },
  {
    claim: "Tested against real PostgreSQL",
    detail: "Concurrency tests run in CI against a Postgres service container, because SQLite ignores row locks.",
    path: "backend/tests/test_concurrency.py",
    file: "test_concurrency.py",
  },
  {
    claim: "Every action leaves a trace",
    detail: "Create, approve, reject and cancel each write an audit entry in the same transaction as the change.",
    path: "backend/app/routes/leave.py",
    file: "routes/leave.py",
  },
  {
    claim: "Access follows the org chart",
    detail: "Worker, manager, HR and admin roles. Managers see and decide only their own team. Sessions use an HttpOnly cookie.",
    path: "backend/app/auth.py",
    file: "auth.py",
  },
  {
    claim: "Webhooks must be signed",
    detail: "Incoming WhatsApp events are checked with an HMAC-SHA256 signature whenever an app secret is configured.",
    path: "backend/app/auth.py",
    file: "auth.py",
  },
];

export function LandingPage() {
  // The backend may be asleep. Poke it in the background so it is awake by the time someone tries the demo.
  useEffect(() => {
    const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
    fetch(api, { mode: "no-cors" }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-lg font-semibold tracking-tight">LeaveFlow</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          <a href="#try" className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground md:block">Try the parser</a>
          <a href="#product" className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground md:block">The dashboard</a>
          <a href="#trust" className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground md:block">Under the hood</a>
          <a href={REPO} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:flex">
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
          <SidebarLeaves className="pointer-events-none absolute -left-10 top-4 -z-10 h-72 w-auto -rotate-12 opacity-40" />
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> WhatsApp in, live dashboard out
            </p>
            <h1 className="font-serif text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Leave requests that start as a <span className="italic text-primary">text message.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Employees ask on WhatsApp. Managers decide in a live inbox. Balances, overlaps and weekends are checked automatically, and two approvers can never both win.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="px-7">
                <Link href="/signin?demo=1">
                  Try the live demo <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-7">
                <a href={REPO} target="_blank" rel="noopener noreferrer">
                  <Github className="h-5 w-5" /> View the code
                </a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              One click signs you in to the shared demo account. The first load can take a moment while the server wakes up.
            </p>
          </div>

          <WhatsAppDemo />
        </section>

        {/* Try the parser */}
        <section id="try" className="border-y border-border bg-card/60 py-20">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Try it</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Type it the way you&apos;d text it.</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              This is the actual message parser from the backend, not a mock-up. Give it a message and see what it understood, or where it gives up.
            </p>
            <div className="mt-10">
              <ParserPlayground />
            </div>
          </div>
        </section>

        {/* The product */}
        <section id="product" className="py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">The other side</p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl font-semibold tracking-tight sm:text-4xl">What the manager sees.</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">Screenshots of the running app, with the demo team&apos;s data.</p>
            <div className="mt-10">
              <ProductTabs />
            </div>
            <p className="mt-8 text-sm text-muted-foreground">Employees use WhatsApp; the dashboard is for managers, HR and admins.</p>
          </div>
        </section>

        {/* Concurrency */}
        <section className="border-y border-border bg-card/60 py-20">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">The hard part</p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Two managers. One request. One decision.</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              HR data has to stay right when people click at the same moment. In the test suite, two approvers act at the same instant against a real PostgreSQL database, and exactly one wins.
            </p>
            <div className="mt-10">
              <RaceStory />
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Illustration of the behaviour the tests check; see{" "}
              <a className="font-medium text-primary underline-offset-4 hover:underline" href={blob("backend/tests/test_concurrency.py")} target="_blank" rel="noopener noreferrer">
                test_concurrency.py
              </a>
              .
            </p>
          </div>
        </section>

        {/* Receipts */}
        <section id="trust" className="py-20">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Under the hood</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Claims with a link to the code.</h2>
            <dl className="mt-10 divide-y divide-border border-y border-border">
              {RECEIPTS.map((item) => (
                <div key={item.claim} className="grid gap-2 py-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)_auto] sm:items-baseline sm:gap-6">
                  <dt className="font-semibold">{item.claim}</dt>
                  <dd className="text-sm leading-relaxed text-muted-foreground">{item.detail}</dd>
                  <dd>
                    <a
                      href={blob(item.path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whitespace-nowrap font-mono text-xs text-primary underline-offset-4 hover:underline"
                    >
                      {item.file} ↗
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Closing */}
        <section className="px-5 pb-20 sm:px-8">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground">
            <SidebarLeaves className="pointer-events-none absolute -bottom-6 -left-6 h-60 w-auto text-primary-foreground opacity-25" />
            <SidebarLeaves className="pointer-events-none absolute -bottom-8 -right-10 h-72 w-auto -scale-x-100 text-primary-foreground opacity-20" />
            <h2 className="relative font-serif text-3xl font-semibold tracking-tight sm:text-4xl">See the real dashboard.</h2>
            <p className="relative mx-auto mt-3 max-w-lg text-primary-foreground/80">
              One click signs you in to the shared demo account. It is a live app, so expect test data, and there is a Restart demo button if you break something.
            </p>
            <Button asChild size="lg" className="relative mt-7 bg-background px-7 text-foreground hover:bg-background/90">
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
            <a href={REPO} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a>
            <Link href="/signin" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
