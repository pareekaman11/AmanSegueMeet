"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import {
  useGetDecisionById,
  useGetDecisionVoteSummary,
  useCastDecisionVote,
  useCloseDecision,
} from "@/hooks/use-decisions";
import { useVotingSocket } from "@/hooks/use-voting-socket";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function DecisionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const role = user?.memberships?.[0]?.role;
  const canManage = ["BOARD_ADMIN", "CHAIR", "SECRETARY"].includes(role || "");

  const { data: decision, isLoading, error } = useGetDecisionById(params.id);
  const { data: summary, isLoading: isLoadingSummary } = useGetDecisionVoteSummary(params.id);
  const closeDecision = useCloseDecision();

  useVotingSocket('decision', params.id as string);

  if (isLoading || isLoadingSummary) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !decision) {
    return (
      <div className="p-8 text-center text-slate-500">
        Decision not found or you don't have access.
      </div>
    );
  }

  const handleClose = () => {
    if (confirm("Are you sure you want to close this decision? Voting will be locked.")) {
      closeDecision.mutate(decision.id, {
        onSuccess: () => toast.success("Decision closed successfully"),
        onError: (err: any) => toast.error(err.response?.data?.message || "Failed to close decision"),
      });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-800 flex items-center">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant={decision.status === "OPEN" ? "default" : "secondary"}>
                {decision.status}
              </Badge>
              {decision.status === "CLOSED" && decision.outcome && (
                <Badge variant={decision.outcome === "PASSED" ? "default" : decision.outcome === "FAILED" ? "destructive" : "secondary"} className={decision.outcome === "PASSED" ? "bg-green-600" : ""}>
                  {decision.outcome}
                </Badge>
              )}
              {decision.meeting && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                  Meeting: {decision.meeting.title}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{decision.title}</h1>
            <p className="text-sm text-slate-500 mt-1">Date: {new Date(decision.date).toLocaleDateString()}</p>
          </div>
          {canManage && decision.status === "OPEN" && (
            <Button variant="outline" onClick={handleClose} disabled={closeDecision.isPending}>
              {closeDecision.isPending ? "Closing..." : "Close Decision"}
            </Button>
          )}
        </div>
        
        {decision.description && (
          <div className="mt-6 text-slate-700 whitespace-pre-wrap">
            {decision.description}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Voting Panel */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Your Vote</h2>
          <VotingPanel decision={decision} user={user} />
        </div>

        {/* Results Panel */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Results Summary</h2>
          {summary ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 text-green-700 border border-green-100">
                <div className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> In Favour</div>
                <div className="font-semibold text-lg">{summary.IN_FAVOUR || 0}</div>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 text-red-700 border border-red-100">
                <div className="flex items-center"><XCircle className="w-4 h-4 mr-2" /> Against</div>
                <div className="font-semibold text-lg">{summary.AGAINST || 0}</div>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
                <div className="flex items-center"><MinusCircle className="w-4 h-4 mr-2" /> Abstain</div>
                <div className="font-semibold text-lg">{summary.ABSTAIN || 0}</div>
              </div>
              <div className="pt-2 text-sm text-center text-slate-500">
                Total Votes: {summary.TOTAL || 0}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">No results available.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function VotingPanel({ decision, user }: { decision: any, user: any }) {
  const castVote = useCastDecisionVote();
  
  const [comment, setComment] = useState("");
  
  const existingVote = decision.votes?.find((v: any) => v.voterId === user?.id);

  if (decision.status !== "OPEN") {
    if (existingVote) {
      return (
        <div className="text-slate-600 bg-slate-50 p-4 rounded-lg border">
          <p className="text-sm font-medium mb-1">You voted: <strong className="text-slate-900">{existingVote.vote}</strong></p>
          {existingVote.comment && <p className="text-xs italic">"{existingVote.comment}"</p>}
          <p className="text-xs text-red-500 mt-3">Voting is now closed.</p>
        </div>
      );
    }
    return <div className="text-slate-500 p-4 bg-slate-50 rounded-lg">Voting is closed. You did not cast a vote.</div>;
  }

  const handleVote = (vote: string) => {
    castVote.mutate({ decisionId: decision.id, vote, comment: comment || undefined }, {
      onSuccess: () => toast.success("Vote recorded successfully"),
      onError: (err: any) => toast.error(err.response?.data?.message || "Failed to record vote")
    });
  };

  const isPending = castVote.isPending;

  return (
    <div className="space-y-4">
      {existingVote && (
        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4 border border-blue-100">
          You have currently voted: <strong>{existingVote.vote}</strong>
          {existingVote.comment && <p className="italic mt-1">"{existingVote.comment}"</p>}
        </div>
      )}
      <Textarea 
        placeholder="Add an optional comment..." 
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mb-4"
      />
      <div className="grid grid-cols-3 gap-2">
        <Button 
          variant={existingVote?.vote === "IN_FAVOUR" ? "default" : "outline"}
          className={existingVote?.vote === "IN_FAVOUR" ? "bg-green-600 hover:bg-green-700" : "hover:bg-green-50"}
          onClick={() => handleVote("IN_FAVOUR")}
          disabled={isPending}
        >
          In Favour
        </Button>
        <Button 
          variant={existingVote?.vote === "AGAINST" ? "default" : "outline"}
          className={existingVote?.vote === "AGAINST" ? "bg-red-600 hover:bg-red-700" : "hover:bg-red-50"}
          onClick={() => handleVote("AGAINST")}
          disabled={isPending}
        >
          Against
        </Button>
        <Button 
          variant={existingVote?.vote === "ABSTAIN" ? "default" : "outline"}
          className={existingVote?.vote === "ABSTAIN" ? "bg-slate-700 hover:bg-slate-800" : "hover:bg-slate-50"}
          onClick={() => handleVote("ABSTAIN")}
          disabled={isPending}
        >
          Abstain
        </Button>
      </div>
    </div>
  );
}
