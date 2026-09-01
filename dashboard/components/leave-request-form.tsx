"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Lightbulb, Smartphone } from "lucide-react";

interface LeaveFormProps {
  onSubmit?: (data: LeaveFormData) => Promise<void>;
}

interface LeaveFormData {
  leaveType: "casual" | "sick" | "special" | "unpaid";
  startDate: string;
  endDate: string;
  reason: string;
}

export function LeaveRequestForm({ onSubmit }: LeaveFormProps) {
  const [formData, setFormData] = useState<LeaveFormData>({
    leaveType: "casual",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      setSuccess(true);
      setFormData({
        leaveType: "casual",
        startDate: "",
        endDate: "",
        reason: "",
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit leave request"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Leave</CardTitle>
        <CardDescription>
          Submit a new leave request. Your manager will be notified immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">
                  Error
                </p>
                <p className="text-sm text-destructive">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="flex gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-success">
                  Request submitted
                </p>
                <p className="text-sm text-success">
                  Your manager has been notified and will review your request
                  soon.
                </p>
              </div>
            </div>
          )}

          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Leave Type
            </label>
            <select
              value={formData.leaveType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  leaveType: e.target.value as LeaveFormData["leaveType"],
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="special">Special Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1.5">
              Select the type of leave you want to request
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startDate: e.target.value,
                    })
                  }
                  required
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endDate: e.target.value,
                    })
                  }
                  required
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reason (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
              <textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reason: e.target.value,
                  })
                }
                placeholder="Let your manager know why you need this leave..."
                rows={4}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Providing a reason increases approval chances
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
            <Button
              type="reset"
              variant="outline"
              className="flex-1"
              onClick={() =>
                setFormData({
                  leaveType: "casual",
                  startDate: "",
                  endDate: "",
                  reason: "",
                })
              }
            >
              Clear
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> <strong>Tip:</strong> Submit requests at least 5 days in advance for better approval chances.
            </p>
            <p className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> <strong>Tip:</strong> You&apos;ll receive WhatsApp notifications about your request status.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
