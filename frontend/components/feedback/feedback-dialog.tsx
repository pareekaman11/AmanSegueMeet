"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquarePlus, Sparkles, Bug, Lightbulb, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useSubmitFeedback } from "@/hooks/use-feedback";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { user, activeOrgId } = useAuth();
  const orgId = activeOrgId || user?.memberships?.[0]?.organisationId;
  const submitFeedback = useSubmitFeedback();

  const [type, setType] = useState<"SUGGESTION" | "FEATURE_REQUEST" | "BUG" | "GENERAL">("SUGGESTION");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      toast.error("Organisation context not found. Please reload the page.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter your feedback message");
      return;
    }

    submitFeedback.mutate(
      {
        organisationId: orgId,
        type,
        message: message.trim(),
        pageUrl: typeof window !== "undefined" ? window.location.pathname : undefined,
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
          toast.success("Thank you! Your feedback has been received.");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to submit feedback");
        },
      }
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after dialog animation completes
    setTimeout(() => {
      setMessage("");
      setType("SUGGESTION");
      setIsSuccess(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900">
                Share Product Feedback
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Help us improve SegueMeet with your ideas, feature requests, or bug reports.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-semibold text-slate-800">Feedback Submitted</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Thank you for helping us improve SegueMeet. Our product team reviews all submissions.
            </p>
            <Button
              onClick={handleClose}
              className="mt-4 bg-[#31327c] hover:bg-[#262762] text-white text-xs h-9"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Feedback Type</label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger className="w-full h-10 border-slate-200 text-slate-700 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUGGESTION">
                    <span className="flex items-center gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      Suggestion
                    </span>
                  </SelectItem>
                  <SelectItem value="FEATURE_REQUEST">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      Feature Request
                    </span>
                  </SelectItem>
                  <SelectItem value="BUG">
                    <span className="flex items-center gap-2">
                      <Bug className="w-3.5 h-3.5 text-red-500" />
                      Bug Report
                    </span>
                  </SelectItem>
                  <SelectItem value="GENERAL">
                    <span className="flex items-center gap-2">
                      <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                      General Feedback
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-700">Your Feedback *</label>
                <span className="text-[10px] text-slate-400">{message.length}/2000</span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                placeholder="What can we improve or what feature would you like to see?"
                required
                rows={4}
                className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400 resize-none"
              />
            </div>

            <DialogFooter className="pt-3 border-t flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitFeedback.isPending || !message.trim()}
                className="bg-[#31327c] hover:bg-[#262762] text-white text-xs h-9"
              >
                {submitFeedback.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Submit Feedback
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
