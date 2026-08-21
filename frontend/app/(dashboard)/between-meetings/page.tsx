"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Send, 
  FileType2, 
  CheckSquare2, 
  ListFilter, 
  Loader2, 
  ThumbsUp, 
  ThumbsDown,
  X,
  ChevronDown,
  RotateCcw,
  Check
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState, useMemo } from "react";
import { AddResolutionModal } from "@/components/resolutions/add-resolution-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function BetweenMeetingsPage() {
  const { user, activeOrgId } = useAuth();
  const orgId = activeOrgId || user?.memberships?.[0]?.organisationId;
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: resolutions = [], isLoading } = useQuery({
    queryKey: ["resolutions", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await api.get(`/resolutions`, {
        params: { organisationId: orgId }
      });
      return res.data;
    },
    enabled: !!orgId,
  });

  const voteMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "IN_FAVOUR" | "AGAINST" }) => {
      const res = await api.post(`/resolutions/${id}/vote`, { status, vote: status });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.status === "IN_FAVOUR" ? "Vote cast: Approved (In Favour)" : "Vote cast: Rejected (Against)");
      queryClient.invalidateQueries({ queryKey: ["resolutions"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to record vote");
    },
  });

  // Type options map
  const typeLabels: Record<string, string> = {
    ALL: "All Types",
    RESOLUTION: "Circular Resolution",
    APPROVAL: "Approval",
    REPORT: "Report",
  };

  // Outcome options map
  const outcomeLabels: Record<string, string> = {
    ALL: "All Outcomes",
    PASSED: "Approved / Passed",
    FAILED: "Rejected / Failed",
    OPEN: "Pending / In Progress",
    CANCELLED: "Cancelled",
  };

  // Status options map
  const statusLabels: Record<string, string> = {
    ALL: "All Statuses",
    OPEN: "Open",
    PASSED: "Passed",
    FAILED: "Failed",
    DRAFT: "Draft",
    CANCELLED: "Cancelled",
  };

  const hasActiveFilters = search.trim() !== "" || typeFilter !== "ALL" || outcomeFilter !== "ALL" || statusFilter !== "ALL";

  const clearAllFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setOutcomeFilter("ALL");
    setStatusFilter("ALL");
  };

  const filteredResolutions = useMemo(() => {
    return resolutions.filter((res: any) => {
      // 1. Search Query
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesTitle = res.title?.toLowerCase().includes(query);
        const matchesDesc = res.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // 2. Type Filter
      if (typeFilter !== "ALL") {
        const itemType = res.type || "RESOLUTION";
        if (typeFilter === "APPROVAL" && itemType !== "APPROVAL" && itemType !== "RESOLUTION") return false;
        if (typeFilter === "RESOLUTION" && itemType !== "RESOLUTION" && itemType !== "APPROVAL") return false;
        if (typeFilter === "REPORT" && itemType !== "REPORT") return false;
      }

      // 3. Outcome Filter
      if (outcomeFilter !== "ALL") {
        if (outcomeFilter === "PASSED" && res.status !== "PASSED") return false;
        if (outcomeFilter === "FAILED" && res.status !== "FAILED") return false;
        if (outcomeFilter === "OPEN" && res.status !== "OPEN") return false;
        if (outcomeFilter === "CANCELLED" && res.status !== "CANCELLED") return false;
      }

      // 4. Status Filter
      if (statusFilter !== "ALL") {
        if (res.status !== statusFilter) return false;
      }

      return true;
    });
  }, [resolutions, search, typeFilter, outcomeFilter, statusFilter]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
            Between Meetings
            <span className="text-sm font-normal text-muted-foreground ml-2 hidden sm:inline-block">
              Approvals and Reports for when there isn't a meeting
            </span>
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-white border-slate-200 text-sm focus-visible:ring-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="w-full sm:w-auto bg-[#1e1b4b] hover:bg-[#2e2b5b] text-white rounded-md px-6 h-9"
          >
            + Add
          </Button>
        </div>
      </div>

      {orgId && (
        <AddResolutionModal 
          organisationId={orgId}
          isOpen={isAddOpen}
          onOpenChange={setIsAddOpen}
        />
      )}

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors cursor-pointer outline-none ${
              typeFilter !== "ALL"
                ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold"
                : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <FileType2 className={`w-4 h-4 ${typeFilter !== "ALL" ? "text-blue-600" : "text-slate-500"}`} />
            <span>{typeFilter !== "ALL" ? `Type: ${typeLabels[typeFilter]}` : "Type"}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white shadow-lg border border-slate-100 rounded-lg p-1">
            {Object.entries(typeLabels).map(([key, label]) => (
              <DropdownMenuItem 
                key={key} 
                onClick={() => setTypeFilter(key)}
                className="flex items-center justify-between text-xs py-2 px-2.5 rounded cursor-pointer hover:bg-slate-50"
              >
                <span className={typeFilter === key ? "font-semibold text-blue-600" : "text-slate-700"}>{label}</span>
                {typeFilter === key && <Check className="w-3.5 h-3.5 text-blue-600 ml-2" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Outcome Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors cursor-pointer outline-none ${
              outcomeFilter !== "ALL"
                ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold"
                : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <CheckSquare2 className={`w-4 h-4 ${outcomeFilter !== "ALL" ? "text-blue-600" : "text-slate-500"}`} />
            <span>{outcomeFilter !== "ALL" ? `Outcome: ${outcomeLabels[outcomeFilter]}` : "Outcome"}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 bg-white shadow-lg border border-slate-100 rounded-lg p-1">
            {Object.entries(outcomeLabels).map(([key, label]) => (
              <DropdownMenuItem 
                key={key} 
                onClick={() => setOutcomeFilter(key)}
                className="flex items-center justify-between text-xs py-2 px-2.5 rounded cursor-pointer hover:bg-slate-50"
              >
                <span className={outcomeFilter === key ? "font-semibold text-blue-600" : "text-slate-700"}>{label}</span>
                {outcomeFilter === key && <Check className="w-3.5 h-3.5 text-blue-600 ml-2" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors cursor-pointer outline-none ${
              statusFilter !== "ALL"
                ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold"
                : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <ListFilter className={`w-4 h-4 ${statusFilter !== "ALL" ? "text-blue-600" : "text-slate-500"}`} />
            <span>{statusFilter !== "ALL" ? `Status: ${statusLabels[statusFilter]}` : "Status"}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white shadow-lg border border-slate-100 rounded-lg p-1">
            {Object.entries(statusLabels).map(([key, label]) => (
              <DropdownMenuItem 
                key={key} 
                onClick={() => setStatusFilter(key)}
                className="flex items-center justify-between text-xs py-2 px-2.5 rounded cursor-pointer hover:bg-slate-50"
              >
                <span className={statusFilter === key ? "font-semibold text-blue-600" : "text-slate-700"}>{label}</span>
                {statusFilter === key && <Check className="w-3.5 h-3.5 text-blue-600 ml-2" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters Action */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
      ) : filteredResolutions.length === 0 ? (
        <div className="border border-slate-200 rounded-xl bg-white h-[60vh] flex flex-col items-center justify-center text-center shadow-sm p-6">
          <div className="bg-slate-100 p-6 rounded-2xl mb-4">
            <Send className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-700 text-[15px] font-medium">No results found</p>
          {hasActiveFilters ? (
            <p className="text-slate-400 text-xs mt-1 max-w-sm">
              No items match your active search or filters.{" "}
              <button onClick={clearAllFilters} className="text-blue-600 hover:underline font-medium">
                Clear all filters
              </button>
            </p>
          ) : (
            <p className="text-slate-400 text-xs mt-1">
              Create a circular resolution or approval out-of-session.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredResolutions.map((res: any) => {
            const myVote = res.votes?.find((v: any) => v.voterId === user?.id);
            const inFavour = res.votes?.filter((v: any) => v.status === "IN_FAVOUR").length || 0;
            const against = res.votes?.filter((v: any) => v.status === "AGAINST").length || 0;

            return (
              <div key={res.id} className="border border-slate-200 rounded-xl bg-white p-6 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-800">{res.title}</h3>
                    <p className="text-slate-600 mt-1">{res.description}</p>
                    <div className="text-sm text-slate-400 mt-2">Closes: {new Date(res.closeDate).toLocaleDateString()}</div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    res.status === 'PASSED' ? 'bg-green-100 text-green-700' :
                    res.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    res.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {res.status}
                  </span>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between border border-slate-100 gap-4 sm:gap-0">
                  <div className="flex items-center justify-center sm:justify-start gap-6">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 font-medium">In Favour</span>
                      <span className="text-lg font-bold text-green-600">{inFavour}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 font-medium">Against</span>
                      <span className="text-lg font-bold text-red-600">{against}</span>
                    </div>
                  </div>
                  
                  {res.status === 'OPEN' && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        disabled={voteMutation.isPending}
                        variant={myVote?.status === "IN_FAVOUR" ? "default" : "outline"} 
                        className={`flex-1 sm:flex-none ${myVote?.status === "IN_FAVOUR" ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : "text-green-600 border-green-200 hover:bg-green-50"}`}
                        onClick={() => voteMutation.mutate({ id: res.id, status: "IN_FAVOUR" })}
                      >
                        {voteMutation.isPending && (voteMutation.variables as any)?.id === res.id && (voteMutation.variables as any)?.status === "IN_FAVOUR" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ThumbsUp className="w-4 h-4 mr-2" />
                        )}
                        Approve
                      </Button>
                      <Button 
                        disabled={voteMutation.isPending}
                        variant={myVote?.status === "AGAINST" ? "default" : "outline"}
                        className={`flex-1 sm:flex-none ${myVote?.status === "AGAINST" ? "bg-red-600 hover:bg-red-700 text-white border-red-600" : "text-red-600 border-red-200 hover:bg-red-50"}`}
                        onClick={() => voteMutation.mutate({ id: res.id, status: "AGAINST" })}
                      >
                        {voteMutation.isPending && (voteMutation.variables as any)?.id === res.id && (voteMutation.variables as any)?.status === "AGAINST" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ThumbsDown className="w-4 h-4 mr-2" />
                        )}
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
