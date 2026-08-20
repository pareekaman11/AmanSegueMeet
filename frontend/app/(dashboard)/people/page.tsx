"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { User, ExternalLink, Info, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { BoardProfileTab } from "@/components/people/board-profile-tab";
import { ChangesLogTab } from "@/components/people/changes-log-tab";
import { InterestsRegisterTab } from "@/components/people/interests-register-tab";
import { AddInterestModal } from "@/components/people/add-interest-modal";
import { ManageTenureNotificationsModal } from "@/components/people/manage-tenure-notifications-modal";
import { EditMemberModal } from "@/components/people/edit-member-modal";
import { AddPersonModal } from "@/components/people/add-person-modal";
import { AccessLevelsModal } from "@/components/people/access-levels-modal";
import { toast } from "sonner";

export default function PeoplePage() {
  const [activeTab, setActiveTab] = useState("people");
  const [isAddInterestOpen, setIsAddInterestOpen] = useState(false);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isManageTenureOpen, setIsManageTenureOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isAccessLevelsOpen, setIsAccessLevelsOpen] = useState(false);

  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organisationId || user?.memberships?.[0]?.organisation?.id;
  const userRole = user?.memberships?.[0]?.role;
  const canManagePeople = ["BOARD_ADMIN", "CHAIR", "SECRETARY"].includes(userRole || "");

  const { data: orgData } = useQuery({
    queryKey: ["organisation", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const res = await api.get(`/organisations/${orgId}`);
      return res.data;
    },
    enabled: !!orgId,
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await api.get(`/organisations/${orgId}/members`);
      return res.data;
    },
    enabled: !!orgId,
  });

  const boardMembers = members.filter((m: any) => 
    ["BOARD_ADMIN", "CHAIR", "SECRETARY", "BOARD_MEMBER"].includes(m.role)
  );
  const otherMembers = members.filter((m: any) => 
    !["BOARD_ADMIN", "CHAIR", "SECRETARY", "BOARD_MEMBER"].includes(m.role)
  );

  const renderEmptyState = (message: string) => (
    <div className="border rounded-xl bg-white p-24 flex flex-col items-center justify-center text-center shadow-sm">
      <div className="bg-gray-50 p-4 rounded-2xl mb-4">
        <User className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-slate-600 text-sm">{message}</p>
    </div>
  );

  const renderPeopleList = (people: any[]) => {
    return (
      <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-slate-500 border-b">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Designation</th>
              <th className="px-6 py-4 font-medium">Roles</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {people.map((person: any) => (
              <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {person.user.name.charAt(0).toUpperCase()}
                  </div>
                  {person.user.name}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {person.designation || <span className="text-slate-400 italic">None</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-slate-600 rounded-md text-xs font-medium">
                      {person.role.replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500">{person.user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit gap-1.5 bg-green-100 text-green-700`}>
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditingMember(person)} className="text-slate-500 hover:text-blue-600">
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
            People 
            <span className="text-sm font-normal text-muted-foreground ml-2">
              Manage and view your Board and Team
            </span>
          </h1>
        </div>
        {activeTab === "interests" ? (
          <Button 
            onClick={() => setIsAddInterestOpen(true)}
            className="bg-[#2d1b54] hover:bg-[#1a0f35] text-white rounded-md px-6 shadow-sm flex items-center gap-2 font-medium h-9"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add New Interest
          </Button>
        ) : (
          canManagePeople && (
            <Button 
              onClick={() => setIsAddPersonOpen(true)}
              className="bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-md px-6 shadow-sm flex items-center gap-2 font-medium h-9"
            >
              <User className="w-4 h-4" />
              Add Person
            </Button>
          )
        )}
      </div>

      <AddPersonModal 
        isOpen={isAddPersonOpen} 
        onOpenChange={setIsAddPersonOpen} 
        organisationId={orgId || ""} 
      />

      {orgId && (
        <AddInterestModal
          organisationId={orgId}
          members={members}
          isOpen={isAddInterestOpen}
          onOpenChange={setIsAddInterestOpen}
        />
      )}

      {orgId && (
        <ManageTenureNotificationsModal
          organisationId={orgId}
          members={members}
          currentAdminId={orgData?.settings?.tenureAdminId}
          isOpen={isManageTenureOpen}
          onOpenChange={setIsManageTenureOpen}
        />
      )}

      <AccessLevelsModal
        isOpen={isAccessLevelsOpen}
        onOpenChange={setIsAccessLevelsOpen}
      />

      {orgId && (
        <EditMemberModal
          organisationId={orgId}
          member={editingMember}
          isOpen={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b pb-0 mb-6">
          <TabsList className="bg-transparent h-auto p-0 rounded-none border-none space-x-6">
            <TabsTrigger 
              value="people" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-semibold text-slate-700"
            >
              People List
            </TabsTrigger>
            <TabsTrigger 
              value="profile"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-muted-foreground"
            >
              Board Profile
            </TabsTrigger>
            <TabsTrigger 
              value="changes"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-muted-foreground"
            >
              Changes Log
            </TabsTrigger>
            <TabsTrigger 
              value="interests"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-muted-foreground"
            >
              Interests Register
            </TabsTrigger>
          </TabsList>
          
          <Link href="#" onClick={(e) => { e.preventDefault(); setIsAccessLevelsOpen(true); }} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            Access Levels <ExternalLink className="ml-1.5 w-4 h-4" />
          </Link>
        </div>

        <TabsContent value="people" className="mt-0 space-y-8">
          
          {isLoading ? (
            <div className="flex h-[50vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
          

          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Board Members</h3>
            {boardMembers.length === 0 ? renderEmptyState("No Board Members listed") : renderPeopleList(boardMembers)}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Team & Guests</h3>
            {otherMembers.length === 0 ? renderEmptyState("No other members listed") : renderPeopleList(otherMembers)}
          </div>

            </>
          )}

        </TabsContent>
        
        <TabsContent value="profile" className="mt-0">
          <BoardProfileTab onManageTenure={() => setIsManageTenureOpen(true)} person={{ user }} />
        </TabsContent>
        <TabsContent value="changes" className="mt-0">
          {orgId && <ChangesLogTab organisationId={orgId} />}
        </TabsContent>
        <TabsContent value="interests" className="mt-0">
          {orgId && <InterestsRegisterTab organisationId={orgId} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
