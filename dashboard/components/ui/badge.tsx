import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-muted text-muted-foreground",
        pending:
          "border-warning/30 bg-warning/10 text-warning",
        approved:
          "border-success/30 bg-success/10 text-success",
        rejected:
          "border-destructive/30 bg-destructive/10 text-destructive",
        cancelled:
          "border-border bg-muted text-muted-foreground",
        outline:
          "border-border text-foreground",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
