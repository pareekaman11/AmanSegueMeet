"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface AddMeetingModalProps {
  organisationId: string;
  committeeId?: string;
  trigger?: React.ReactNode;
}

export function AddMeetingModal({ organisationId, committeeId, trigger }: AddMeetingModalProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  // Meeting Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState("10");
  const [startMin, setStartMin] = useState("00");
  const [startAmPm, setStartAmPm] = useState("am");

  const [endHour, setEndHour] = useState("12");
  const [endMin, setEndMin] = useState("00");
  const [endAmPm, setEndAmPm] = useState("pm");

  const [locationId, setLocationId] = useState("");
  const [sendNotice, setSendNotice] = useState(false);
  const [timeZone, setTimeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [requiredQuorum, setRequiredQuorum] = useState("");

  // Location Form State
  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [locTimeZone, setLocTimeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [locIsDefault, setLocIsDefault] = useState(false);

  // Video Link & Attendees State
  const [videoLink, setVideoLink] = useState("");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);

  // Fetch Locations
  const { data: locations = [] } = useQuery({
    queryKey: ["locations", organisationId],
    queryFn: async () => {
      const res = await api.get(`/organisations/${organisationId}/locations`);
      return res.data;
    },
    enabled: !!organisationId && isOpen,
  });

  // Fetch Members for Attendees Selection
  const { data: members = [] } = useQuery({
    queryKey: ["members", organisationId],
    queryFn: async () => {
      const res = await api.get(`/organisations/${organisationId}/members`);
      return res.data;
    },
    enabled: !!organisationId && isOpen,
  });

  // Calculate Duration
  const formatTime24 = (h: string, m: string, ampm: string) => {
    let hr = parseInt(h);
    if (ampm === "pm" && hr < 12) hr += 12;
    if (ampm === "am" && hr === 12) hr = 0;
    return `${hr.toString().padStart(2, "0")}:${m.padStart(2, "0")}`;
  };

  const getDurationString = () => {
    if (!startHour || !endHour) return "0 hrs";

    let sh = parseInt(startHour);
    if (startAmPm === "pm" && sh < 12) sh += 12;
    if (startAmPm === "am" && sh === 12) sh = 0;
    const start = sh * 60 + parseInt(startMin || "0");

    let eh = parseInt(endHour);
    if (endAmPm === "pm" && eh < 12) eh += 12;
    if (endAmPm === "am" && eh === 12) eh = 0;
    const end = eh * 60 + parseInt(endMin || "0");

    let diff = end - start;
    if (diff < 0) diff += 24 * 60; // Crosses midnight

    const h = Math.floor(diff / 60);
    const m = diff % 60;

    if (h === 0) return `${m} mins`;
    if (m === 0) return `${h} hrs`;
    return `${h} hrs ${m} mins`;
  };

  // Mutations
  const createLocationMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/organisations/${organisationId}/locations`, {
        name: locName,
        address: locAddress,
        timeZone: locTimeZone,
        isDefault: locIsDefault,
      });
      return res.data;
    },
    onSuccess: (newLoc) => {
      queryClient.invalidateQueries({ queryKey: ["locations", organisationId] });
      setLocationId(newLoc.id);
      setIsLocationOpen(false);
      // Reset form
      setLocName("");
      setLocAddress("");
      setLocIsDefault(false);
    },
    onError: (error: any) => {
      console.error("Location creation failed:", error.response?.data || error.message);
    }
  });

  const createMeetingMutation = useMutation({
    mutationFn: async () => {
      const activeLocations = locations.filter((l: any) => l.isActive !== false);
      const selectedLoc = activeLocations.find((l: any) => l.id === locationId) || activeLocations.find((l: any) => l.isDefault) || activeLocations[0];
      const locString = selectedLoc ? (selectedLoc.address ? `${selectedLoc.name} – ${selectedLoc.address}` : selectedLoc.name) : "TBD";

      await api.post(`/meetings`, {
        organisationId,
        title,
        date,
        startTime: formatTime24(startHour, startMin, startAmPm),
        endTime: formatTime24(endHour, endMin, endAmPm),
        timeZone,
        location: locString,
        locationId: selectedLoc?.id || undefined,
        videoLink: videoLink || selectedLoc?.meetingUrl || undefined,
        attendeeIds,
        committeeId,
        committeeVisible: committeeId ? true : false,
        requiredQuorum: requiredQuorum ? parseInt(requiredQuorum) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", organisationId] });
      setIsOpen(false);
      // Reset form
      setTitle("");
      setDate("");
      setRequiredQuorum("");
    },
    onError: (error: any) => {
      console.error("Meeting creation failed:", error.response?.data || error.message);
    }
  });

  const activeLocations = locations.filter((l: any) => l.isActive !== false);
  const selectedLocation = activeLocations.find((l: any) => l.id === locationId) || activeLocations.find((l: any) => l.isDefault) || activeLocations[0];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {trigger && React.cloneElement(trigger as React.ReactElement<any>, { onClick: () => setIsOpen(true) })}
        <DialogContent className="sm:max-w-[560px] p-0 flex flex-col max-h-[90vh] rounded-xl overflow-hidden shadow-2xl border bg-white">
          <div className="p-6 pb-4 border-b border-slate-100 flex items-center gap-3 shrink-0 bg-white">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">Add a meeting</DialogTitle>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 font-medium">Title*</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Board of Directors Quarterly Review"
                className="border-0 border-b border-slate-300 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-600 shadow-none text-slate-800"
              />
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-xs text-slate-500 font-medium">Date*</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border-0 border-b border-slate-300 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-600 shadow-none text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-500 font-medium">Start Time*</Label>
                <div className="flex items-center border-b border-slate-300">
                  <Input value={startHour} onChange={e => setStartHour(e.target.value)} className="w-8 border-0 p-0 text-center shadow-none focus-visible:ring-0" maxLength={2} />
                  <span>:</span>
                  <Input value={startMin} onChange={e => setStartMin(e.target.value)} className="w-8 border-0 p-0 text-center shadow-none focus-visible:ring-0" maxLength={2} />
                  <Select value={startAmPm} onValueChange={(val) => setStartAmPm(val || "am")}>
                    <SelectTrigger className="w-[60px] border-0 bg-transparent shadow-none focus:ring-0 px-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="am">am</SelectItem>
                      <SelectItem value="pm">pm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-500 font-medium">Close Time*</Label>
                <div className="flex items-center border-b border-slate-300">
                  <Input value={endHour} onChange={e => setEndHour(e.target.value)} className="w-8 border-0 p-0 text-center shadow-none focus-visible:ring-0" maxLength={2} />
                  <span>:</span>
                  <Input value={endMin} onChange={e => setEndMin(e.target.value)} className="w-8 border-0 p-0 text-center shadow-none focus-visible:ring-0" maxLength={2} />
                  <Select value={endAmPm} onValueChange={(val) => setEndAmPm(val || "pm")}>
                    <SelectTrigger className="w-[60px] border-0 bg-transparent shadow-none focus:ring-0 px-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="am">am</SelectItem>
                      <SelectItem value="pm">pm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-slate-400 mt-1">{getDurationString()}</p>
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs text-slate-500 font-medium">Meeting Time Zone*</Label>
              <Select value={timeZone} onValueChange={(val) => setTimeZone(val || "UTC")}>
                <SelectTrigger className="w-full border-0 border-b border-slate-300 rounded-none px-0 shadow-none focus:ring-0 text-slate-800 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                  <SelectItem value="Pacific/Auckland">Pacific/Auckland</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Required Quorum */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs text-slate-500 font-medium">Required Quorum (Optional)</Label>
              <Input
                type="number"
                min={1}
                value={requiredQuorum}
                onChange={(e) => setRequiredQuorum(e.target.value)}
                placeholder="Leave blank to use organisation default rule (e.g. majority)"
                className="border-0 border-b border-slate-300 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-600 shadow-none text-slate-800"
              />
            </div>

            {/* Location */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs text-slate-500 font-medium">Location</Label>
              <Select value={locationId || selectedLocation?.id || ""} onValueChange={setLocationId}>
                <SelectTrigger className="w-full border-0 border-b border-slate-300 rounded-none px-0 shadow-none focus:ring-0 text-slate-800 font-medium">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {activeLocations.map((loc: any) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name} {loc.isDefault ? "(default)" : ""} {loc.type ? `[${loc.type.toLowerCase()}]` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedLocation && (
                <div className="text-xs text-slate-600 mt-2 space-y-0.5 bg-slate-50 p-2.5 rounded border border-slate-100">
                  <div className="font-semibold text-slate-700">{selectedLocation.name}</div>
                  {selectedLocation.address && <p className="text-slate-500">{selectedLocation.address}</p>}
                  {selectedLocation.meetingUrl && (
                    <p className="text-blue-600 truncate">{selectedLocation.meetingUrl}</p>
                  )}
                </div>
              )}

              <Button
                type="button"
                variant="ghost"
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-0 h-auto mt-4 font-medium flex items-center gap-1"
                onClick={() => setIsLocationOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Add a Meeting Location
              </Button>
            </div>

            {/* Video Link */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs text-slate-500 font-medium">Video Meeting Link (Optional)</Label>
              <Input
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder="e.g. https://meet.google.com/xyz"
                className="border-0 border-b border-slate-300 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-600 shadow-none text-slate-800"
              />
            </div>

            {/* Attendees */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs text-slate-500 font-medium">Invitees</Label>
              <div className="border border-slate-200 rounded-md p-3 max-h-40 overflow-y-auto space-y-2 bg-slate-50">
                {members.map((member: any) => (
                  <div key={member.user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`member-${member.user.id}`}
                      checked={attendeeIds.includes(member.user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAttendeeIds(prev => [...prev, member.user.id]);
                        } else {
                          setAttendeeIds(prev => prev.filter(id => id !== member.user.id));
                        }
                      }}
                    />
                    <Label htmlFor={`member-${member.user.id}`} className="text-sm cursor-pointer">
                      {member.user.name} <span className="text-slate-500">({member.role.replace('_', ' ')})</span>
                    </Label>
                  </div>
                ))}
                {members.length === 0 && <p className="text-xs text-slate-500 italic">No members found.</p>}
              </div>
            </div>

            {/* Notice */}
            <div className="flex items-center space-x-2 pt-4">
              <Checkbox id="sendNotice" checked={sendNotice} onCheckedChange={(c) => setSendNotice(!!c)} />
              <Label htmlFor="sendNotice" className="text-sm text-slate-700 cursor-pointer">
                Send Meeting Notice
              </Label>
            </div>
          </div>

          <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="bg-white">
              Cancel
            </Button>
            <Button
              onClick={() => createMeetingMutation.mutate()}
              disabled={createMeetingMutation.isPending || !title || !date}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
            >
              {createMeetingMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nested Location Modal */}
      <Dialog open={isLocationOpen} onOpenChange={setIsLocationOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 flex flex-col max-h-[90vh] rounded-xl overflow-hidden shadow-2xl border bg-white z-[60]">
          <div className="p-6 pb-4 border-b border-slate-100 flex items-center gap-3 shrink-0 bg-white">
            <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">Add a Meeting Location</DialogTitle>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 font-medium">Name*</Label>
              <Input
                value={locName}
                onChange={(e) => setLocName(e.target.value)}
                placeholder="e.g. Headquarters Boardroom"
                className="border-0 border-b border-slate-300 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-600 shadow-none text-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-500 font-medium">Address*</Label>
              <Input
                value={locAddress}
                onChange={(e) => setLocAddress(e.target.value)}
                placeholder="e.g. 100 Innovation Way, Suite 400"
                className="border-0 border-b border-slate-300 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-600 shadow-none text-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-500 font-medium">Location Time Zone*</Label>
              <Select value={locTimeZone} onValueChange={(val) => setLocTimeZone(val || "Asia/Kolkata")}>
                <SelectTrigger className="w-full border-0 border-b border-slate-300 rounded-none px-0 shadow-none focus:ring-0 text-slate-800 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                  <SelectItem value="Pacific/Auckland">Pacific/Auckland</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="isDefault" checked={locIsDefault} onCheckedChange={(c) => setLocIsDefault(!!c)} />
              <Label htmlFor="isDefault" className="text-sm text-slate-700 cursor-pointer">
                Set as default
              </Label>
            </div>
          </div>

          <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <Button variant="outline" onClick={() => setIsLocationOpen(false)} className="bg-white">
              Cancel
            </Button>
            <Button
              onClick={() => createLocationMutation.mutate()}
              disabled={createLocationMutation.isPending || !locName || !locAddress}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
            >
              {createLocationMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
