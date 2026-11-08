"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, LeaveRequest } from "@/app/lib/api";

/**
 * Approve / reject with consistent feedback. If someone else already decided,
 * the server says so; show that plainly and refresh instead of a generic failure.
 */
export function useRequestActions(onDone?: (request: LeaveRequest) => void) {
  const queryClient = useQueryClient();

  const finish = (request: LeaveRequest) => {
    queryClient.invalidateQueries();
    onDone?.(request);
  };

  const fail = (error: Error) => {
    if (/already/i.test(error.message)) {
      toast.warning("Someone got there first", { description: error.message });
      queryClient.invalidateQueries();
    } else {
      toast.error("That did not work", { description: error.message });
    }
  };

  const approve = useMutation({
    mutationFn: (id: number) => api.approveLeave(id),
    onSuccess: (request) => {
      toast.success(`Approved ${request.user?.name ?? "request"}`);
      finish(request);
    },
    onError: fail,
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => api.rejectLeave(id, reason),
    onSuccess: (request) => {
      toast.success(`Rejected ${request.user?.name ?? "request"}`);
      finish(request);
    },
    onError: fail,
  });

  return { approve, reject, busy: approve.isPending || reject.isPending };
}

export type RequestActions = ReturnType<typeof useRequestActions>;
