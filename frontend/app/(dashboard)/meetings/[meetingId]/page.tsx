"use client";

import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  FileText, 
  MoreVertical,
  Folder,
  Info,
  Download,
  Clock,
  Trash2,
} from "lucide-react";
import { use, useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { BuildAgendaModal } from "@/components/meetings/build-agenda-modal";
import { AddAttendeeModal } from "@/components/meetings/add-attendee-modal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function MeetingOverviewPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isBuildAgendaOpen, setIsBuildAgendaOpen] = useState(false);
  const [isAddAttendeeOpen, setIsAddAttendeeOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingNotice, setIsGeneratingNotice] = useState(false);
  const [showMyTime, setShowMyTime] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [videoLinkInput, setVideoLinkInput] = useState("");
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close the ⋮ menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ["meeting", meetingId],
    queryFn: async () => {
      const res = await api.get(`/meetings/${meetingId}`);
      return res.data;
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members", meeting?.organisationId],
    queryFn: async () => {
      if (!meeting?.organisationId) return [];
      const res = await api.get(`/organisations/${meeting.organisationId}/members`);
      return res.data;
    },
    enabled: !!meeting?.organisationId,
  });

  const updateAdminMutation = useMutation({
    mutationFn: async (administrator: string) => {
      const res = await api.patch(`/meetings/${meetingId}`, { administrator });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      toast.success("Meeting administrator updated");
    },
    onError: () => toast.error("Failed to update administrator"),
  });

  const updateVideoLinkMutation = useMutation({
    mutationFn: async (videoLink: string) => {
      const res = await api.patch(`/meetings/${meetingId}`, { videoLink });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      toast.success("Video link updated");
      setIsEditingVideo(false);
    },
    onError: () => toast.error("Failed to update video link"),
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col">
        <p className="text-muted-foreground">Failed to load meeting details.</p>
      </div>
    );
  }

  // ─── Handlers ────────────────────────────────────────────────

  const handleDownloadBoardPack = async () => {
    try {
      setIsGeneratingPdf(true);
      const res = await api.get(`/meetings/${meetingId}/board-pack/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `board-pack-${meetingId}.pdf`;
      a.click();
    } catch (err) {
      toast.error("Failed to generate Board Pack PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadNotice = async () => {
    try {
      setIsGeneratingNotice(true);
      const res = await api.get(`/meetings/${meetingId}/notice/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `notice-${meetingId}.pdf`;
      a.click();
    } catch (err) {
      toast.error("Failed to generate Notice PDF");
    } finally {
      setIsGeneratingNotice(false);
    }
  };

  const handleAddToCalendar = () => {
    const startDt = meeting.date.replace(/-/g, '') + 'T' + meeting.startTime.replace(':', '') + '00';
    const endDt = meeting.date.replace(/-/g, '') + 'T' + meeting.endTime.replace(':', '') + '00';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SegueMeet//EN',
      'BEGIN:VEVENT',
      `DTSTART:${startDt}`,
      `DTEND:${endDt}`,
      `SUMMARY:${meeting.title}`,
      `LOCATION:${meeting.location || ''}`,
      `DESCRIPTION:${meeting.notes || 'Meeting scheduled via SegueMeet'}`,
      `URL:${window.location.href}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/\s+/g, '-')}.ics`;
    a.click();
    toast.success("Calendar file downloaded! Open it to add to your calendar.");
  };

  // ─── Time formatting ──────────────────────────────────────────

  const dateObj = new Date(meeting.date);
  const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const buildTimeStr = (timeStr: string, localise: boolean) => {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(dateObj);
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString(localise ? undefined : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...(localise ? { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone } : {}),
    }).toLowerCase();
  };

  const startTimeStr = buildTimeStr(meeting.startTime, showMyTime);
  const endTimeStr = buildTimeStr(meeting.endTime, showMyTime);

  const [sh, sm] = meeting.startTime.split(':').map(Number);
  const [eh, em] = meeting.endTime.split(':').map(Number);
  const diffMins = (eh * 60 + em) - (sh * 60 + sm);
  const diffHrs = Math.round((diffMins / 60) * 10) / 10;

  const myTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const displayTz = showMyTime ? myTz : 'Asia/Kolkata';

  const creatorName = members.find((m: any) => m.user.id === meeting.creatorId)?.user.name || meeting.administrator || "—";

  return (
    <div className="max-w-5xl mx-auto p-8">

      {/* Top right buttons */}
      <div className="flex justify-end gap-2 mb-6">
        <Button
          variant="outline"
          onClick={handleDownloadNotice}
          disabled={isGeneratingNotice}
          className="text-slate-600 bg-white border-slate-200 shadow-sm h-8 px-3 text-xs font-medium rounded-md"
        >
          {isGeneratingNotice
            ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin text-slate-400" />
            : <Download className="w-3.5 h-3.5 mr-2 text-slate-400" />}
          Notice
        </Button>
        <Button onClick={() => router.push(`/meetings/${meetingId}/agenda`)} variant="outline" className="text-slate-600 bg-white border-slate-200 shadow-sm h-8 px-3 text-xs font-medium rounded-md">
          <FileText className="w-3.5 h-3.5 mr-2 text-slate-400" /> Agenda
        </Button>
        <Button
          variant="outline"
          onClick={handleDownloadBoardPack}
          disabled={isGeneratingPdf}
          className="text-slate-600 bg-white border-slate-200 shadow-sm h-8 px-3 text-xs font-medium rounded-md"
        >
          {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin text-slate-400" /> : <Folder className="w-3.5 h-3.5 mr-2 text-slate-400" />}
          Board Pack
        </Button>
        <Button onClick={() => router.push(`/meetings/${meetingId}/minutes`)} variant="outline" className="text-slate-600 bg-white border-slate-200 shadow-sm h-8 px-3 text-xs font-medium rounded-md">
          <FileText className="w-3.5 h-3.5 mr-2 text-slate-400" /> Minutes
        </Button>

        {/* ⋮ More Menu */}
        <div className="relative" ref={moreMenuRef}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowMoreMenu(v => !v)}
            className="text-slate-600 bg-white border-slate-200 shadow-sm h-8 w-8 rounded-md"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
          {showMoreMenu && (
            <div className="absolute right-0 top-10 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-44 text-sm">
              <button
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                onClick={() => { handleAddToCalendar(); setShowMoreMenu(false); }}
              >
                <Calendar className="w-4 h-4 text-slate-400" /> Add to Calendar
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                onClick={() => { router.push(`/meetings/${meetingId}/agenda`); setShowMoreMenu(false); }}
              >
                <FileText className="w-4 h-4 text-slate-400" /> View Agenda
              </button>
              <hr className="my-1 border-slate-100" />
              <button
                className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600"
                onClick={() => { setShowMoreMenu(false); /* future: open delete confirm */ toast.info("Delete not available in this release"); }}
              >
                <Trash2 className="w-4 h-4" /> Delete Meeting
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Header Row */}
      <div className="flex justify-between items-start mb-12">
        <h1 className="text-[32px] font-normal text-slate-800">{meeting.title}</h1>

        {meeting.agendaStatus !== 'PUBLISHED' && (
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
              {meeting.agendaSections?.length > 0 ? 'Edit Agenda' : 'No Agenda'}
            </span>
            <Button
              onClick={() => setIsBuildAgendaOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded font-medium px-4 h-8 text-sm shadow-sm"
            >
              Build Agenda
            </Button>
          </div>
        )}
      </div>

      <BuildAgendaModal
        isOpen={isBuildAgendaOpen}
        onOpenChange={setIsBuildAgendaOpen}
        meetingId={meeting.id}
      />

      <AddAttendeeModal
        isOpen={isAddAttendeeOpen}
        onOpenChange={setIsAddAttendeeOpen}
        meetingId={meeting.id}
        members={members}
        currentAttendees={meeting.attendees || []}
      />

      {/* Main Details Grid */}
      <div className="grid grid-cols-[240px_1fr] gap-y-8">

        {/* Date */}
        <div className="text-sm font-semibold text-slate-700 pt-1">Date:</div>
        <div className="text-sm text-slate-800 flex items-center gap-3">
          {dateStr} <span className="text-slate-400 text-xs">({displayTz})</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMyTime(false)}
              className={`text-sm font-medium transition-colors ${!showMyTime ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Meeting Time
            </button>
            <button
              onClick={() => setShowMyTime(v => !v)}
              aria-label="Toggle timezone"
              className={`w-8 h-4 rounded-full relative transition-colors ${showMyTime ? 'bg-blue-500' : 'bg-slate-300'}`}
            >
              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[1px] transition-all ${showMyTime ? 'right-[1px]' : 'left-[1px]'}`} />
            </button>
            <button
              onClick={() => setShowMyTime(true)}
              className={`text-sm font-medium transition-colors ${showMyTime ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              My Time
            </button>
          </div>
        </div>

        {/* Time */}
        <div className="text-sm font-semibold text-slate-700 pt-1">Time:</div>
        <div className="text-sm text-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <span>{startTimeStr}</span>
            <span className="text-slate-400">-</span>
            <span>{endTimeStr}</span>
            <span className="text-slate-500 ml-2">{diffHrs} hrs</span>
          </div>
          <button
            onClick={handleAddToCalendar}
            className="text-blue-600 font-medium flex items-center gap-1.5 text-xs hover:underline"
          >
            <Calendar className="w-3.5 h-3.5" />
            Add To Calendar
          </button>
        </div>

        {/* Location */}
        <div className="text-sm font-semibold text-slate-700 pt-1">Location:</div>
        <div className="text-sm text-slate-600 leading-relaxed">
          {meeting.location || <span className="italic text-slate-400">No location specified</span>}
        </div>

        {/* Video URL */}
        <div className="text-sm font-semibold text-slate-700 pt-1">Video URL:</div>
        <div className="flex items-start">
          {isEditingVideo ? (
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={videoLinkInput}
                onChange={(e) => setVideoLinkInput(e.target.value)}
                className="border border-slate-200 rounded text-sm px-3 py-1.5 w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="https://zoom.us/j/..."
              />
              <Button
                size="sm"
                variant="default"
                onClick={() => updateVideoLinkMutation.mutate(videoLinkInput)}
                disabled={updateVideoLinkMutation.isPending}
              >
                {updateVideoLinkMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingVideo(false)}
                disabled={updateVideoLinkMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {meeting.videoLink ? (
                <a href={meeting.videoLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded shadow-sm transition-colors">
                  Join Video Meeting
                </a>
              ) : (
                <span className="text-slate-500 italic">No video link provided</span>
              )}
              <button
                onClick={() => {
                  setVideoLinkInput(meeting.videoLink || "");
                  setIsEditingVideo(true);
                }}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Meeting Administrator */}
        <div className="text-sm font-semibold text-slate-700 pt-1 mt-2">Meeting Administrator:</div>
        <div className="mt-2">
          <select
            className="border border-slate-200 rounded text-sm px-3 py-1.5 w-64 text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-300"
            value={meeting.administrator || creatorName}
            onChange={(e) => updateAdminMutation.mutate(e.target.value)}
          >
            {members.map((m: any) => (
              <option key={m.user.id} value={m.user.name}>{m.user.name}</option>
            ))}
            {members.length === 0 && (
              <option value={meeting.administrator || creatorName}>{meeting.administrator || creatorName}</option>
            )}
          </select>
          {updateAdminMutation.isPending && (
            <Loader2 className="inline ml-2 w-4 h-4 animate-spin text-slate-400" />
          )}
        </div>

        {/* Attendees / Apologies */}
        <div className="text-sm font-semibold text-slate-700 pt-1 mt-4">Attendees/Apologies:</div>
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-4 w-[550px]">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Attendees (Invited)</h4>
              <div className="border border-blue-200 bg-blue-50/30 rounded p-2 text-sm text-slate-700 space-y-2 min-h-[48px]">
                {meeting.attendees?.length > 0 ? (
                  meeting.attendees.map((a: any) => (
                    <div key={a.id} className="flex justify-between items-center">
                      <span>{a.user.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        a.rsvp === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                        a.rsvp === 'DECLINED' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{a.rsvp}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic text-xs">No attendees invited.</div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Apologies</h4>
              <div className="bg-slate-100 rounded p-2 text-sm text-slate-400 min-h-[48px] flex flex-col justify-center">
                {meeting.attendees?.filter((a: any) => a.rsvp === 'DECLINED').length > 0 ? (
                  meeting.attendees.filter((a: any) => a.rsvp === 'DECLINED').map((a: any) => (
                    <div key={a.id} className="text-slate-600 text-sm py-0.5">{a.user.name}</div>
                  ))
                ) : (
                  <span className="italic text-xs">No apologies yet.</span>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Attendees who decline will appear in the Apologies column.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <Button onClick={() => setIsAddAttendeeOpen(true)} variant="outline" className="h-8 px-4 text-xs font-medium text-slate-600">
              Add from People List
            </Button>
          </div>
        </div>

        {/* Notes */}
        <div className="text-sm font-semibold text-slate-700 pt-1 mt-2">Notes:</div>
        <div className="mt-2">
          {meeting.notes ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{meeting.notes}</p>
          ) : (
            <button
              onClick={() => router.push(`/meetings/${meetingId}/agenda`)}
              className="text-sm text-emerald-600 hover:underline cursor-pointer"
            >
              Click here to add some notes at the top of the Agenda
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
