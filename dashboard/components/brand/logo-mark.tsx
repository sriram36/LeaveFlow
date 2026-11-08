import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

/** The LeaveFlow mark: a leaf (leave, leaf) on the brand colour. */
export function LogoMark({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <span
      aria-hidden
      className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground", className)}
    >
      <Leaf className={cn("h-5 w-5", iconClassName)} />
    </span>
  );
}
