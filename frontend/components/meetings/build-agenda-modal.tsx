"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { X, Crown, Lightbulb, Sparkles } from "lucide-react";

import { useCreateAgendaSection, useCreateAgendaItem } from "@/hooks/use-agenda";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BuildAgendaModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
}

export function BuildAgendaModal({ isOpen, onOpenChange, meetingId }: BuildAgendaModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isBuilding, setIsBuilding] = useState(false);
  const router = useRouter();

  const createSection = useCreateAgendaSection(meetingId);
  const createItem = useCreateAgendaItem(meetingId);

  const handleBuildAgenda = async () => {
    if (!selectedTemplate) return;
    
    setIsBuilding(true);
    try {


      if (selectedTemplate === "best-practice" || selectedTemplate === "strategic") {
        // Build 4 standard sections
        
        // Section 1
        const s1 = await createSection.mutateAsync({ title: "Welcome & Preliminary", position: 0 });
        await createItem.mutateAsync({ sectionId: s1.id, data: { title: "Apologies", purpose: "NONE", durationMinutes: 2, position: 0 } });
        await createItem.mutateAsync({ sectionId: s1.id, data: { title: "Declarations of Interest", purpose: "NONE", durationMinutes: 3, position: 1 } });
        
        // Section 2
        const s2 = await createSection.mutateAsync({ title: "Minutes of Previous Meeting", position: 1 });
        await createItem.mutateAsync({ sectionId: s2.id, data: { title: "Confirm Minutes", purpose: "FOR_DECISION", durationMinutes: 5, position: 0 } });
        
        // Section 3
        const s3 = await createSection.mutateAsync({ title: "Main Business", position: 2 });
        await createItem.mutateAsync({ sectionId: s3.id, data: { title: "CEO Report", purpose: "FOR_DISCUSSION", durationMinutes: 20, position: 0 } });
        await createItem.mutateAsync({ sectionId: s3.id, data: { title: "Financial Report", purpose: "FOR_DISCUSSION", durationMinutes: 15, position: 1 } });
        
        // Section 4
        const s4 = await createSection.mutateAsync({ title: "Close", position: 3 });
        await createItem.mutateAsync({ sectionId: s4.id, data: { title: "Any other business", purpose: "FOR_NOTING", durationMinutes: 5, position: 0 } });
      }

      onOpenChange(false);
      // Navigate to the agenda tab
      router.push(`/meetings/${meetingId}/agenda`);
      toast.success("Agenda built successfully");
    } catch (error) {
      console.error("Failed to build agenda", error);
      toast.error("Failed to build agenda");
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between pr-10">
          <div>
            <DialogTitle className="text-lg">Build agenda</DialogTitle>
            <p className="text-sm text-slate-500 mt-1">Select an option below to start building your agenda.</p>
          </div>
        </DialogHeader>

        <div className="p-6">
          <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate} className="space-y-4">
            
            <Label 
              htmlFor="best-practice"
              className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedTemplate === "best-practice" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <RadioGroupItem value="best-practice" id="best-practice" className="sr-only" />
              <Crown className={`w-5 h-5 ${selectedTemplate === "best-practice" ? "text-emerald-600" : "text-slate-700"}`} />
              <span className={`text-base font-medium ${selectedTemplate === "best-practice" ? "text-emerald-900" : "text-slate-800"}`}>
                Best practice template
              </span>
            </Label>

            <Label 
              htmlFor="strategic"
              className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedTemplate === "strategic" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <RadioGroupItem value="strategic" id="strategic" className="sr-only" />
              <Lightbulb className={`w-5 h-5 ${selectedTemplate === "strategic" ? "text-emerald-600" : "text-slate-700"}`} />
              <span className={`text-base font-medium ${selectedTemplate === "strategic" ? "text-emerald-900" : "text-slate-800"}`}>
                Strategic agenda template
              </span>
            </Label>



          </RadioGroup>
        </div>

        <DialogFooter className="px-6 py-4 flex gap-3 justify-end items-center bg-gray-50 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isBuilding} className="text-slate-700 hover:bg-slate-200">
            Cancel
          </Button>
          <Button 
            disabled={!selectedTemplate || isBuilding}
            onClick={handleBuildAgenda}
            className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 font-semibold"
          >
            {isBuilding ? "Building..." : "Build agenda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
