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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LifeBuoy, CheckCircle2, Loader2, Ticket, AlertCircle } from "lucide-react";
import { useSubmitSupportRequest } from "@/hooks/use-support";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const { user, activeOrgId } = useAuth();
  const orgId = activeOrgId || user?.memberships?.[0]?.organisationId;
  const submitSupport = useSubmitSupportRequest();

  const [category, setCategory] = useState("ACCOUNT_LOGIN");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [createdTicket, setCreatedTicket] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      toast.error("Organisation context not found. Please reload the page.");
      return;
    }
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in the subject and description");
      return;
    }

    submitSupport.mutate(
      {
        organisationId: orgId,
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
      },
      {
        onSuccess: (data) => {
          setCreatedTicket(data);
          toast.success(`Support ticket #${data.ticketNumber} created`);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to submit support request");
        },
      }
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setSubject("");
      setDescription("");
      setCategory("ACCOUNT_LOGIN");
      setPriority("MEDIUM");
      setCreatedTicket(null);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900">
                Contact SegueMeet Support
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Need help with your account, meetings, governance packs, or technical issues?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {createdTicket ? (
          <div className="py-6 text-center space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-800">Support Request Submitted</h4>
              <p className="text-xs text-slate-500 mt-1">
                Your ticket has been logged and our support team has been notified.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-sm mx-auto space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700">
                <Ticket className="w-4 h-4 text-purple-600" />
                Ticket Number: <span className="text-purple-700">{createdTicket.ticketNumber}</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">Subject: {createdTicket.subject}</p>
            </div>

            <Button
              onClick={handleClose}
              className="mt-2 bg-[#31327c] hover:bg-[#262762] text-white text-xs h-9"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Category *</label>
                <Select value={category} onValueChange={(val) => setCategory(val || "ACCOUNT_LOGIN")}>
                  <SelectTrigger className="w-full h-9 border-slate-200 text-xs text-slate-700 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACCOUNT_LOGIN">Account / Login</SelectItem>
                    <SelectItem value="MEETINGS">Meetings</SelectItem>
                    <SelectItem value="AGENDA">Agenda</SelectItem>
                    <SelectItem value="BOARD_PACK">Board Pack</SelectItem>
                    <SelectItem value="MINUTES">Minutes & Decisions</SelectItem>
                    <SelectItem value="DOCUMENTS">Documents</SelectItem>
                    <SelectItem value="NOTIFICATIONS">Notifications</SelectItem>
                    <SelectItem value="OTHER">Other Assistance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Priority</label>
                <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                  <SelectTrigger className="w-full h-9 border-slate-200 text-xs text-slate-700 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low - General query</SelectItem>
                    <SelectItem value="MEDIUM">Medium - Normal issue</SelectItem>
                    <SelectItem value="HIGH">High - Urgent / Meeting blocker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Subject *</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                placeholder="Brief summary of the problem"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-700">Description *</label>
                <span className="text-[10px] text-slate-400">{description.length}/3000</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={3000}
                placeholder="Please describe the issue in detail, including what you were trying to do."
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
                disabled={submitSupport.isPending || !subject.trim() || !description.trim()}
                className="bg-[#31327c] hover:bg-[#262762] text-white text-xs h-9"
              >
                {submitSupport.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
