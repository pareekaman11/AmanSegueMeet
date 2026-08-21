"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddMeetingModal } from "@/components/meetings/add-meeting-modal";
import { Button } from "@/components/ui/button";

function agendaBadge(status: string) {
  return status === "published" ? (
    <Badge>Published</Badge>
  ) : (
    <Badge variant="secondary">Draft</Badge>
  );
}

function minutesBadge(status: string) {
  const labels: Record<string, string> = {
    not_started: "Not started",
    draft: "Draft",
    in_review: "In review",
    confirmed: "Confirmed",
  };
  return <Badge variant="outline">{labels[status]}</Badge>;
}

export default function MeetingsPage() {
  const { user } = useAuth();
  
  // Example of passing organisationId from user's membership
  // Real implementation might allow user to select org from a dropdown
  const orgId = user?.memberships?.[0]?.organisationId;

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meetings", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await api.get(`/meetings`, {
        params: { organisationId: orgId }
      });
      return res.data.data || [];
    },
    enabled: !!orgId,
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const upcoming = meetings.filter((m: any) => m.date >= today);
  const past = meetings.filter((m: any) => m.date < today);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight break-words">Meetings for {user?.memberships?.[0]?.organisation?.name || "Organisation"}</h1>
        {orgId && (
          <AddMeetingModal 
            organisationId={orgId} 
            trigger={
              <Button className="rounded-md bg-[#2d1b54] hover:bg-[#1a0f35] text-white px-4 py-2 text-sm font-semibold shadow-sm flex items-center gap-2 h-9">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                Add Meeting
              </Button>
            } 
          />
        )}
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Upcoming
        </h2>
        <MeetingTable meetings={upcoming} />
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Past
        </h2>
        <MeetingTable meetings={past} />
      </section>
    </div>
  );
}

function MeetingTable({ meetings }: { meetings: any[] }) {
  if (meetings.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
        No meetings here yet.
      </p>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Agenda</TableHead>
            <TableHead>Minutes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {meetings.map((m: any) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">
                <Link href={`/meetings/${m.id}/agenda`} className="hover:underline">
                  {m.title}
                </Link>
              </TableCell>
              <TableCell>
                {new Date(m.date).toLocaleDateString()} {m.startTime}
              </TableCell>
              <TableCell>{m.location || 'N/A'}</TableCell>
              <TableCell>{agendaBadge(m.agenda?.status || 'draft')}</TableCell>
              <TableCell>{minutesBadge(m.minutes?.status || 'not_started')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}