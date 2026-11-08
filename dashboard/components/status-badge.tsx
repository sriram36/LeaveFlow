import { Badge } from "@/components/ui/badge";
import { CircleCheck, Circle as CircleX, Clock, Ban } from "lucide-react";
import type { LeaveRequest } from "@/app/lib/api";

const ICONS = { pending: Clock, approved: CircleCheck, rejected: CircleX, cancelled: Ban } as const;

export function StatusBadge({ status }: { status: LeaveRequest["status"] }) {
  const Icon = ICONS[status];
  return (
    <Badge variant={status} className="capitalize">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {status}
    </Badge>
  );
}
