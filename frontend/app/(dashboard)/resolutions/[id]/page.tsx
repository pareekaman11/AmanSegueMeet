"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { useGetResolutions, useCastResolutionVote } from "@/hooks/use-decisions";
import { useVotingSocket } from "@/hooks/use-voting-socket";
import { toast } from "sonner";

export default function ResolutionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organisationId;

  // Since we don't have a getResolutionById endpoint, we fetch all and find the one.
  const { data: resolutions, isLoading, error } = useGetResolutions(orgId);
  const resolution = resolutions?.find((r: any) => r.id === params.id);

  useVotingSocket('resolution', params.id as string);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !resolution) {
    return (
      <div className="p-8 text-center text-slate-500">
        Resolution not found or you don't have access.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-800 flex items-center">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant={resolution.status === "OPEN" ? "default" : "secondary"}>
                {resolution.status}
              </Badge>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                Circular Resolution
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{resolution.title}</h1>
            <p className="text-sm text-slate-500 mt-1">Deadline: {new Date(resolution.closeDate).toLocaleDateString()}</p>
          </div>
        </div>
        
        {resolution.description && (
          <div className="mt-6 text-slate-700 whitespace-pre-wrap">
            {resolution.description}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Voting Panel */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Your Vote</h2>
          <VotingPanel resolution={resolution} user={user} />
        </div>

        {/* Results Panel */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Results Summary</h2>
          <ResultsSummary resolution={resolution} />
        </div>
      </div>
    </div>
  );
}

function VotingPanel({ resolution, user }: { resolution: any, user: any }) {
  const castVote = useCastResolutionVote();
  const existingVote = resolution.votes?.find((v: any) => v.voterId === user?.id);

  if (resolution.status !== "OPEN") {
    if (existingVote) {
      return (
        <div className="text-slate-600 bg-slate-50 p-4 rounded-lg border">
          <p className="text-sm font-medium mb-1">You voted: <strong className="text-slate-900">{existingVote.status}</strong></p>
          <p className="text-xs text-red-500 mt-3">Voting is now closed.</p>
        </div>
      );
    }
    return <div className="text-slate-500 p-4 bg-slate-50 rounded-lg">Voting is closed. You did not cast a vote.</div>;
  }

  const handleVote = (status: string) => {
    castVote.mutate({ resolutionId: resolution.id, status }, {
      onSuccess: () => toast.success("Vote recorded successfully"),
      onError: (err: any) => toast.error(err.response?.data?.message || "Failed to cast vote")
    });
  };

  return (
    <div className="space-y-4">
      {existingVote && (
        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4 border border-blue-100">
          You have currently voted: <strong>{existingVote.status}</strong>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        <Button 
          variant={existingVote?.status === "IN_FAVOUR" ? "default" : "outline"}
          className={existingVote?.status === "IN_FAVOUR" ? "bg-green-600 hover:bg-green-700" : "hover:bg-green-50"}
          onClick={() => handleVote("IN_FAVOUR")}
          disabled={castVote.isPending}
        >
          In Favour
        </Button>
        <Button 
          variant={existingVote?.status === "AGAINST" ? "default" : "outline"}
          className={existingVote?.status === "AGAINST" ? "bg-red-600 hover:bg-red-700" : "hover:bg-red-50"}
          onClick={() => handleVote("AGAINST")}
          disabled={castVote.isPending}
        >
          Against
        </Button>
        <Button 
          variant={existingVote?.status === "ABSTAIN" ? "default" : "outline"}
          className={existingVote?.status === "ABSTAIN" ? "bg-slate-700 hover:bg-slate-800" : "hover:bg-slate-50"}
          onClick={() => handleVote("ABSTAIN")}
          disabled={castVote.isPending}
        >
          Abstain
        </Button>
      </div>
    </div>
  );
}

function ResultsSummary({ resolution }: { resolution: any }) {
  const votes = resolution.votes || [];
  const summary = {
    IN_FAVOUR: votes.filter((v: any) => v.status === "IN_FAVOUR").length,
    AGAINST: votes.filter((v: any) => v.status === "AGAINST").length,
    ABSTAIN: votes.filter((v: any) => v.status === "ABSTAIN").length,
    TOTAL: votes.length,
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 text-green-700 border border-green-100">
        <div className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> In Favour</div>
        <div className="font-semibold text-lg">{summary.IN_FAVOUR}</div>
      </div>
      <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 text-red-700 border border-red-100">
        <div className="flex items-center"><XCircle className="w-4 h-4 mr-2" /> Against</div>
        <div className="font-semibold text-lg">{summary.AGAINST}</div>
      </div>
      <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
        <div className="flex items-center"><MinusCircle className="w-4 h-4 mr-2" /> Abstain</div>
        <div className="font-semibold text-lg">{summary.ABSTAIN}</div>
      </div>
      <div className="pt-2 text-sm text-center text-slate-500">
        Total Votes: {summary.TOTAL}
      </div>
    </div>
  );
}
