"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/app/lib/api";
import { Button } from "@/components/ui/button";

/**
 * Puts the demo team's data back to how it started (see backend/app/services/demo_seed.py).
 * Shown only to the shared demo account; the server refuses everyone else.
 */
export function RestartDemoButton({ collapsed = false }: { collapsed?: boolean }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const restart = async () => {
    setBusy(true);
    try {
      await api.resetDemo();
      // Requests and people are re-created with new ids, so drop anything cached about the old ones
      // instead of refetching them, then go back to the start.
      queryClient.removeQueries({
        predicate: (q) => ["audit", "balance", "leave-request"].includes(String(q.queryKey[0])),
      });
      await queryClient.invalidateQueries();
      router.push("/requests");
      toast.success("Demo restarted", { description: "The sample team and requests are back to the start." });
    } catch (error) {
      toast.error("Could not restart the demo", { description: error instanceof Error ? error.message : undefined });
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={restart}
        disabled={busy}
        title="Restart demo"
        aria-label="Restart demo"
        className="flex w-full justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        <RotateCcw className={busy ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      </button>
    );
  }

  if (confirming) {
    return (
      <div className="space-y-2 rounded-xl border border-border bg-muted/50 p-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Reset the sample team and requests to the start? Your changes to them are lost.
        </p>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={restart} disabled={busy}>
            {busy ? "Resetting…" : "Reset"}
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => setConfirming(false)} disabled={busy}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setConfirming(true)}>
      <RotateCcw className="h-4 w-4" /> Restart demo
    </Button>
  );
}
