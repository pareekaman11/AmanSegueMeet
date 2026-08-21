"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAddCommitteeMember, useRemoveCommitteeMember, useUpdateCommitteeMemberRole } from "@/hooks/use-committees";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export function MembersList({ committee }: { committee: any }) {
  const { user, activeOrgId } = useAuth();
  
  // Reliably get active membership
  const activeMembership = user?.memberships?.find(m => m.organisationId === activeOrgId) || user?.memberships?.[0];
  const orgId = activeMembership?.organisationId;
  const organisationId = orgId || "";
  
  const userRole = activeMembership?.role;
  const canManageCommittees = ["BOARD_ADMIN", "CHAIR", "SECRETARY"].includes(userRole || "");

  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("MEMBER");

  const addMember = useAddCommitteeMember(organisationId);
  const removeMember = useRemoveCommitteeMember(organisationId);
  const updateRole = useUpdateCommitteeMemberRole(organisationId);

  const { data: orgMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["members", organisationId],
    queryFn: async () => {
      if (!organisationId) return [];
      const res = await api.get(`/organisations/${organisationId}/members`);
      return res.data;
    },
    enabled: !!organisationId,
  });

  const handleAddMember = async () => {
    if (!newMemberId) return;
    try {
      await addMember.mutateAsync({
        committeeId: committee.id,
        userId: newMemberId,
        role: newMemberRole,
      });
      toast.success("Member added");
      setNewMemberId("");
    } catch (error) {
      toast.error("Failed to add member");
    }
  };

  const availableMembers = orgMembers.filter((m: any) => 
    !committee.members?.some((cm: any) => cm.userId === m.user.id)
  );

  return (
    <div className="space-y-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Committee Members</h3>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col sm:flex-row gap-3 items-end">
        {canManageCommittees && (
          <div className="flex flex-col sm:flex-row w-full items-end gap-3">
            <div className="flex-1 w-full space-y-1.5">
              <Label className="text-xs text-slate-500">Select Person</Label>
              <Select value={newMemberId} onValueChange={(val) => val && setNewMemberId(val)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select a member..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500 text-center">No more members to add</div>
                  ) : (
                    availableMembers.map((m: any) => (
                      <SelectItem key={m.user.id} value={m.user.id}>
                        {m.user.name} ({m.user.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-[150px] space-y-1.5">
              <Label className="text-xs text-slate-500">Role</Label>
              <Select value={newMemberRole} onValueChange={(val) => val && setNewMemberRole(val)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHAIR">Chair</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="SECRETARY">Secretary</SelectItem>
                  <SelectItem value="OBSERVER">Observer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAddMember}
              disabled={!newMemberId || addMember.isPending}
              className="w-full sm:w-auto shrink-0 bg-[#2e2a74] hover:bg-[#1e1b4b]"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        )}
      </div>

      <div className="border rounded-md divide-y">
        {committee.members?.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No members in this committee yet.
          </div>
        ) : (
          committee.members?.map((member: any) => (
            <div key={member.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="font-medium text-sm text-slate-800">{member.user.name}</div>
                <div className="text-xs text-slate-500">{member.user.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <Select 
                  value={member.role} 
                  disabled={!canManageCommittees || updateRole.isPending}
                  onValueChange={(val) => {
                    updateRole.mutate({
                      committeeId: committee.id,
                      userId: member.user.id,
                      role: val
                    });
                  }}
                >
                  <SelectTrigger className="h-8 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHAIR">Chair</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="SECRETARY">Secretary</SelectItem>
                    <SelectItem value="OBSERVER">Observer</SelectItem>
                  </SelectContent>
                </Select>

                {canManageCommittees && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    disabled={removeMember.isPending}
                    onClick={() => {
                      removeMember.mutate({
                        committeeId: committee.id,
                        userId: member.user.id
                      });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
