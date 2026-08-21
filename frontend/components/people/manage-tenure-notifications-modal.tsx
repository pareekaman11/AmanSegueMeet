"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, X, Bell } from "lucide-react";
import { toast } from "sonner";

interface ManageTenureNotificationsModalProps {
  organisationId: string;
  members: any[];
  currentAdminId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageTenureNotificationsModal({
  organisationId,
  members,
  currentAdminId,
  isOpen,
  onOpenChange
}: ManageTenureNotificationsModalProps) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>(currentAdminId || "");

  useEffect(() => {
    if (isOpen) {
      setSelectedUserId(currentAdminId || "");
    }
  }, [isOpen, currentAdminId]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/organisations/${organisationId}`, {
        settings: {
          tenureAdminId: selectedUserId
        }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organisation", organisationId] });
      toast.success("Tenure notification settings updated");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update settings");
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between pr-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-1.5 rounded-md text-blue-600">
              <Bell className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg">Tenure Notifications</DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Select the nominated administrator who will receive two reminders for members with tenure end dates:
            <br/><br/>
            • 8 weeks before the end date<br/>
            • 1 day before the end date
          </p>

          <div className="space-y-3 pt-2">
            <Label className="text-slate-700">Nominated Administrator<span className="text-red-500">*</span></Label>
            <Select value={selectedUserId} onValueChange={(val) => setSelectedUserId(val || "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select admin" />
              </SelectTrigger>
              <SelectContent>
                {members.map(m => (
                  <SelectItem key={m.user.id} value={m.user.id}>
                    {m.user.name} ({m.role.replace('_', ' ')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex gap-3 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6 text-slate-700">
            Cancel
          </Button>
          <Button 
            disabled={updateMutation.isPending || !selectedUserId}
            onClick={() => updateMutation.mutate()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
