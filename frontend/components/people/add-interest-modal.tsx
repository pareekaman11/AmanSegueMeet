"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { X } from "lucide-react";

interface AddInterestModalProps {
  organisationId: string;
  members: any[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddInterestModal({ organisationId, members, isOpen, onOpenChange }: AddInterestModalProps) {
  const queryClient = useQueryClient();
  const [personOption, setPersonOption] = useState("org");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [guestName, setGuestName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notificationDate, setNotificationDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/interests`, {
        organisationId,
        ...(personOption === "org" ? { userId: selectedUserId } : { guestName }),
        title,
        description,
        notificationDate,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interests", organisationId] });
      onOpenChange(false);
      // Reset form
      setSelectedUserId("");
      setTitle("");
      setDescription("");
    },
  });

  const handleSave = () => {
    if (personOption === "org" && !selectedUserId) return;
    if (personOption === "new" && !guestName) return;
    if (!title || !description) return;
    createMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between pr-10">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-1.5 rounded-md text-emerald-600">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <DialogTitle className="text-lg">Add a new interest</DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-slate-700">Person<span className="text-red-500">*</span></Label>
            {personOption === "org" ? (
              <Select value={selectedUserId} onValueChange={(val) => val && setSelectedUserId(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.user.id} value={m.user.id}>{m.user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input 
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Enter person name" 
                className="border-slate-300"
              />
            )}
          </div>

          <RadioGroup value={personOption} onValueChange={setPersonOption} className="flex gap-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="org" id="org" />
              <Label htmlFor="org" className="font-normal text-slate-700">Select Person in the Organisation</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="font-normal text-slate-700">Add someone not on the list</Label>
            </div>
          </RadioGroup>

          <div className="space-y-3">
            <Label className="text-slate-700">Organisation<span className="text-red-500">*</span></Label>
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="E.g. XYZ Corp" 
              className="border-slate-300"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-slate-700">Nature of Interest<span className="text-red-500">*</span></Label>
            <Input 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="E.g. Director, Shareholder" 
              className="border-slate-300"
            />
          </div>

          <div className="space-y-3 w-1/2">
            <Label className="text-slate-700">Notification Date</Label>
            <div className="relative">
              <Input 
                type="date"
                value={notificationDate}
                onChange={e => setNotificationDate(e.target.value)}
                className="border-slate-300 pl-10"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex gap-3 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6 text-slate-700">
            Cancel
          </Button>
          <Button 
            disabled={createMutation.isPending || (personOption === "org" && !selectedUserId) || (personOption === "new" && !guestName) || !title || !description}
            onClick={handleSave}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8"
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
