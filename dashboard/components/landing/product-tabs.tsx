"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  {
    id: "inbox",
    label: "Approval inbox",
    title: "Decide with the context in front of you",
    points: [
      "Each request shows the requester's remaining balance, who on the team is already off, and short notice.",
      "J and K move through the queue, A approves, R opens the reject box.",
      "If another approver gets there first you are told, not shown a generic error.",
    ],
    alt: "The approval inbox: a queue of requests with a detail panel and a checks list",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    title: "The team at a glance",
    points: [
      "Pending, approved today, away today and upcoming leave, all from live data.",
      "Usage by month and by type, and who is in today.",
      "The latest requests and who is away this week.",
    ],
    alt: "The dashboard: summary cards, a leave usage chart, team availability and recent requests",
  },
  {
    id: "timeline",
    label: "Who's away",
    title: "Coverage you can read in a second",
    points: [
      "One row per person, one column per day. Approved leave is solid, requests still waiting are outlined.",
      "Weekends and holidays are left out, matching how working days are counted.",
      "The row on top counts how many people are away each day.",
    ],
    alt: "The team timeline: people down the side, days across the top, leave shown as blocks",
  },
] as const;

/** Real screenshots of the running app (light or dark to match the visitor's theme). */
export function ProductTabs() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("inbox");
  const tab = TABS.find((t) => t.id === active)!;

  return (
    <div>
      <div role="tablist" aria-label="Screens" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={t.id === active}
            aria-controls="product-panel"
            onClick={() => setActive(t.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              t.id === active ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id="product-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] lg:items-center">
        <div>
          <h3 className="font-serif text-2xl font-semibold tracking-tight">{tab.title}</h3>
          <ul className="mt-5 space-y-3 text-muted-foreground">
            {tab.points.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_70px_-30px_rgba(7,60,55,0.45)]">
          <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-4 py-2.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          </div>
          {/* Both themes are in the page; CSS shows the one that matches. Hidden images are not downloaded. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/landing/${tab.id}-light.png`} alt={tab.alt} width={1440} height={900} loading="lazy" className="block h-auto w-full dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/landing/${tab.id}-dark.png`} alt={tab.alt} width={1440} height={900} loading="lazy" className="hidden h-auto w-full dark:block" />
        </div>
      </div>
    </div>
  );
}
