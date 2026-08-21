"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, X, UserCog, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EditMemberModalProps {
  organisationId: string;
  member: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMemberModal({
  organisationId,
  member,
  isOpen,
  onOpenChange
}: EditMemberModalProps) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<string>(member?.role || "BOARD_MEMBER");
  const [tenureEndDate, setTenureEndDate] = useState<string>(member?.tenureEndDate || "");
  const [designation, setDesignation] = useState<string>(member?.designation || "");

  useEffect(() => {
    if (isOpen && member) {
      setRole(member.role);
      setTenureEndDate(member.tenureEndDate || "");
      setDesignation(member.designation || "");
    }
  }, [isOpen, member]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/organisations/${organisationId}/members/${member.user.id}`, {
        role,
        tenureEndDate: tenureEndDate || null,
        designation: designation.trim() || null
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", organisationId] });
      toast.success("Member updated successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update member");
    }
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/organisations/${organisationId}/members/${member.user.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", organisationId] });
      toast.success("Member removed from organisation successfully");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  });

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between pr-10">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-1.5 rounded-md text-orange-600">
              <UserCog className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg">Edit Member: {member.user.name}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-slate-700">Role</Label>
            <Select value={role} onValueChange={(val) => setRole(val || "BOARD_MEMBER")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BOARD_MEMBER">Board Member</SelectItem>
                <SelectItem value="BOARD_ADMIN">Board Admin</SelectItem>
                <SelectItem value="CHAIR">Chair</SelectItem>
                <SelectItem value="SECRETARY">Secretary</SelectItem>
                <SelectItem value="EXECUTIVE">Executive</SelectItem>
                <SelectItem value="GUEST">Guest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-700">Designation / Position Title (Optional)</Label>
            <Input 
              placeholder="e.g. Director, CTO, Advisor"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="border-slate-300"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-slate-700">Tenure End Date (Optional)</Label>
            <Input 
              type="date"
              value={tenureEndDate}
              onChange={(e) => setTenureEndDate(e.target.value)}
              className="border-slate-300"
            />
            <p className="text-xs text-slate-500">
              Used for sending automatic tenure reminders 8 weeks and 1 day before the end date.
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex sm:justify-between items-center w-full">
          <div>
            <AlertDialog>
              <AlertDialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-red-50 text-red-600 hover:text-red-700 h-10 px-4 py-2">
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Member
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove <strong>{member.user.name}</strong> from the organisation. They will immediately lose access to all current and future meetings, committees, and documents. Historical attendance records will be preserved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => removeMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {removeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Yes, remove member
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6 text-slate-700">
              Cancel
            </Button>
            <Button 
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
