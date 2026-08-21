"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  ShieldAlert, 
  Loader2, 
  Save, 
  ShieldCheck, 
  Laptop, 
  Smartphone, 
  Globe, 
  LogOut, 
  Key, 
  Lock,
  AlertCircle,
  CheckCircle2,
  Bell,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  MapPin,
  Video,
  ExternalLink,
  Pencil,
  Trash2,
  Building2,
  Power,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { 
  useGetOrganisationSettings, 
  useUpdateOrganisationSettings, 
  useGetAuditLogs,
  useGetSessions,
  useRevokeSession,
  useRevokeAllOtherSessions,
  useGetLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from "@/hooks/use-settings";
import {
  useGetNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/use-notifications";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, activeOrgId } = useAuth();
  const orgId = activeOrgId || user?.memberships?.[0]?.organisationId;
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [quorumType, setQuorumType] = useState("MAJORITY");
  const [defaultQuorumPercentage, setDefaultQuorumPercentage] = useState("50");
  const [defaultQuorumCount, setDefaultQuorumCount] = useState("");

  // Security Settings State
  const [sessionTimeout, setSessionTimeout] = useState("15");
  const [minPasswordLength, setMinPasswordLength] = useState("12");
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [requireLowercase, setRequireLowercase] = useState(true);
  const [requireNumber, setRequireNumber] = useState(true);
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);
  const [failedLoginThreshold, setFailedLoginThreshold] = useState("5");
  const [lockoutDuration, setLockoutDuration] = useState("15");

  // Notification Preferences State
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [meetingCreated, setMeetingCreated] = useState(true);
  const [meetingUpdated, setMeetingUpdated] = useState(true);
  const [meetingCancelled, setMeetingCancelled] = useState(true);
  const [agendaPublished, setAgendaPublished] = useState(true);
  const [minutesConfirmed, setMinutesConfirmed] = useState(true);
  const [actionItemAssigned, setActionItemAssigned] = useState(true);
  const [documentUploaded, setDocumentUploaded] = useState(true);
  const [tenureExpiring, setTenureExpiring] = useState(true);

  const { data: orgData, isLoading } = useGetOrganisationSettings(orgId);
  const updateMutation = useUpdateOrganisationSettings(orgId);
  const { data: auditLogs = [], isLoading: isLoadingAudit } = useGetAuditLogs(orgId);
  const { data: sessions = [], isLoading: isLoadingSessions } = useGetSessions();
  const revokeSessionMutation = useRevokeSession();
  const revokeOthersMutation = useRevokeAllOtherSessions();

  const { data: notifPrefs, isLoading: isLoadingNotifPrefs } = useGetNotificationPreferences();
  const updateNotifPrefsMutation = useUpdateNotificationPreferences();

  // Locations Data & State
  const { data: locations = [], isLoading: isLoadingLocations } = useGetLocations(orgId);
  const createLocationMutation = useCreateLocation(orgId);
  const updateLocationMutation = useUpdateLocation(orgId);
  const deleteLocationMutation = useDeleteLocation(orgId);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [locName, setLocName] = useState("");
  const [locType, setLocType] = useState<"IN_PERSON" | "VIRTUAL" | "HYBRID">("IN_PERSON");
  const [locAddress, setLocAddress] = useState("");
  const [locMeetingUrl, setLocMeetingUrl] = useState("");
  const [locDescription, setLocDescription] = useState("");
  const [locIsDefault, setLocIsDefault] = useState(false);
  const [locIsActive, setLocIsActive] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleOpenNewLocation = () => {
    setEditingLocation(null);
    setLocName("");
    setLocType("IN_PERSON");
    setLocAddress("");
    setLocMeetingUrl("");
    setLocDescription("");
    setLocIsDefault(false);
    setLocIsActive(true);
    setIsLocationModalOpen(true);
  };

  const handleOpenEditLocation = (loc: any) => {
    setEditingLocation(loc);
    setLocName(loc.name || "");
    setLocType(loc.type || "IN_PERSON");
    setLocAddress(loc.address || "");
    setLocMeetingUrl(loc.meetingUrl || "");
    setLocDescription(loc.description || "");
    setLocIsDefault(Boolean(loc.isDefault));
    setLocIsActive(Boolean(loc.isActive));
    setIsLocationModalOpen(true);
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      toast.error("Organisation context not found. Please reload the page.");
      return;
    }
    if (!locName.trim()) {
      toast.error("Location name is required");
      return;
    }

    const payload = {
      organisationId: orgId,
      name: locName.trim(),
      type: locType,
      address: locType !== "VIRTUAL" ? (locAddress.trim() || undefined) : undefined,
      meetingUrl: locType !== "IN_PERSON" ? (locMeetingUrl.trim() || undefined) : undefined,
      description: locDescription.trim() || undefined,
      isDefault: locIsDefault,
      isActive: locIsActive,
    };

    if (editingLocation) {
      updateLocationMutation.mutate({
        locationId: editingLocation.id,
        organisationId: orgId,
        data: payload,
      }, {
        onSuccess: () => {
          toast.success("Location updated successfully");
          setIsLocationModalOpen(false);
          setEditingLocation(null);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to update location");
        }
      });
    } else {
      createLocationMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Location created successfully");
          setIsLocationModalOpen(false);
          setLocName("");
          setLocAddress("");
          setLocMeetingUrl("");
          setLocDescription("");
          setLocIsDefault(false);
          setLocIsActive(true);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to create location");
        }
      });
    }
  };

  const handleToggleLocationActive = (loc: any) => {
    if (!orgId) return;
    updateLocationMutation.mutate({
      locationId: loc.id,
      organisationId: orgId,
      data: { isActive: !loc.isActive },
    }, {
      onSuccess: () => {
        toast.success(`Location ${!loc.isActive ? 'activated' : 'deactivated'}`);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to update status");
      }
    });
  };

  const handleDeleteLocation = (locId: string) => {
    if (!orgId) return;
    if (!confirm("Are you sure you want to delete this location?")) return;
    deleteLocationMutation.mutate({ locationId: locId, organisationId: orgId }, {
      onSuccess: () => {
        toast.success("Location deleted successfully");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Cannot delete location. Please deactivate it instead.");
      }
    });
  };

  useEffect(() => {
    if (orgData) {
      setName(orgData.name || "");
      setShortName(orgData.settings?.shortName || "");
      setQuorumType(orgData.settings?.quorumType || "MAJORITY");
      setDefaultQuorumPercentage(orgData.settings?.defaultQuorumPercentage || "50");
      setDefaultQuorumCount(orgData.settings?.defaultQuorumCount || "");

      const sec = orgData.settings?.security || {};
      if (sec.sessionTimeout) setSessionTimeout(String(sec.sessionTimeout));
      if (sec.minPasswordLength) setMinPasswordLength(String(sec.minPasswordLength));
      if (sec.requireUppercase !== undefined) setRequireUppercase(Boolean(sec.requireUppercase));
      if (sec.requireLowercase !== undefined) setRequireLowercase(Boolean(sec.requireLowercase));
      if (sec.requireNumber !== undefined) setRequireNumber(Boolean(sec.requireNumber));
      if (sec.requireSpecialChar !== undefined) setRequireSpecialChar(Boolean(sec.requireSpecialChar));
      if (sec.failedLoginThreshold) setFailedLoginThreshold(String(sec.failedLoginThreshold));
      if (sec.lockoutDuration) setLockoutDuration(String(sec.lockoutDuration));
    }
  }, [orgData]);

  useEffect(() => {
    if (notifPrefs) {
      if (notifPrefs.inAppEnabled !== undefined) setInAppEnabled(Boolean(notifPrefs.inAppEnabled));
      if (notifPrefs.emailEnabled !== undefined) setEmailEnabled(Boolean(notifPrefs.emailEnabled));
      if (notifPrefs.meetingCreated !== undefined) setMeetingCreated(Boolean(notifPrefs.meetingCreated));
      if (notifPrefs.meetingUpdated !== undefined) setMeetingUpdated(Boolean(notifPrefs.meetingUpdated));
      if (notifPrefs.meetingCancelled !== undefined) setMeetingCancelled(Boolean(notifPrefs.meetingCancelled));
      if (notifPrefs.agendaPublished !== undefined) setAgendaPublished(Boolean(notifPrefs.agendaPublished));
      if (notifPrefs.minutesConfirmed !== undefined) setMinutesConfirmed(Boolean(notifPrefs.minutesConfirmed));
      if (notifPrefs.actionItemAssigned !== undefined) setActionItemAssigned(Boolean(notifPrefs.actionItemAssigned));
      if (notifPrefs.documentUploaded !== undefined) setDocumentUploaded(Boolean(notifPrefs.documentUploaded));
      if (notifPrefs.tenureExpiring !== undefined) setTenureExpiring(Boolean(notifPrefs.tenureExpiring));
    }
  }, [notifPrefs]);

  const handleSave = () => {
    if (!orgId) {
      toast.error("Organisation context not found. Please refresh the page.");
      return;
    }
    if (!name.trim()) {
      toast.error("Organisation name cannot be empty");
      return;
    }

    updateNotifPrefsMutation.mutate({
      inAppEnabled,
      emailEnabled,
      meetingCreated,
      meetingUpdated,
      meetingCancelled,
      agendaPublished,
      minutesConfirmed,
      actionItemAssigned,
      documentUploaded,
      tenureExpiring,
    });

    updateMutation.mutate({
      organisationId: orgId,
      name,
      settings: {
        ...orgData?.settings,
        shortName,
        quorumType,
        defaultQuorumPercentage,
        defaultQuorumCount,
        security: {
          sessionTimeout: parseInt(sessionTimeout) || 15,
          minPasswordLength: parseInt(minPasswordLength) || 12,
          requireUppercase,
          requireLowercase,
          requireNumber,
          requireSpecialChar,
          failedLoginThreshold: parseInt(failedLoginThreshold) || 5,
          lockoutDuration: parseInt(lockoutDuration) || 15,
        },
      }
    }, {
      onSuccess: () => {
        setSaveSuccess(true);
        toast.success("Settings updated successfully");
        setTimeout(() => setSaveSuccess(false), 3000);
      },
      onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update settings"),
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
            General Settings
            <span className="text-sm font-normal text-muted-foreground ml-2">
              Manage your organisation's preferences and settings
            </span>
          </h1>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <div className="flex items-center justify-between border-b pb-0 mb-6">
          <TabsList className="bg-transparent h-auto p-0 rounded-none border-none flex-nowrap overflow-x-auto w-full justify-start space-x-4 md:space-x-6 scrollbar-hide">
            <TabsTrigger
              value="general"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-semibold text-slate-700 hover:text-slate-900"
            >
              General Settings
            </TabsTrigger>
            <TabsTrigger
              value="quorum"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-slate-500 hover:text-slate-700"
            >
              Quorum & Participation
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-slate-500 hover:text-slate-700"
            >
              Security
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-slate-500 hover:text-slate-700"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-slate-500 hover:text-slate-700"
            >
              Audit Logs
            </TabsTrigger>
            <TabsTrigger
              value="locations"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-slate-500 hover:text-slate-700"
            >
              Meeting Locations
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex items-center justify-end gap-3 mb-6">
          {saveSuccess && (
            <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Settings saved successfully!
            </span>
          )}
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending || isLoading || !name.trim()}
            className={`${
              saveSuccess 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                : "bg-[#6b21a8] hover:bg-[#581c87] text-white"
            } font-medium px-6 h-9 rounded-md transition-all shadow-sm`}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <TabsContent value="general" className="mt-0">
          <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-lg p-4 md:p-8 shadow-sm">
            
            {/* Organisation Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6 first:pt-0">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Organisation Name</h3>
                <p className="text-sm text-slate-500 mt-1">Used on Agenda and Minutes.</p>
              </div>
              <div className="col-span-2">
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="max-w-2xl text-slate-700 h-10 border-slate-200" 
                />
              </div>
            </div>

            {/* Short Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Short Name</h3>
                <p className="text-sm text-slate-500 mt-1">Used on the application interface.</p>
              </div>
              <div className="col-span-2">
                <Input 
                  value={shortName} 
                  onChange={(e) => setShortName(e.target.value)} 
                  className="max-w-2xl h-10 border-slate-200" 
                />
              </div>
            </div>

            {/* Country of Operation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Country of Operation</h3>
                <p className="text-sm text-slate-500 mt-1">Primary Country for this organisation.</p>
                <p className="text-sm text-slate-500 mt-2">Contact SegueMeet support if the country needs to be changed.</p>
              </div>
              <div className="col-span-2">
                <Input defaultValue="India" disabled className="max-w-2xl h-10 border-slate-200 bg-slate-50 text-slate-500" />
              </div>
            </div>

            {/* Organisation Language */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Organisation Language</h3>
                <p className="text-sm text-slate-500 mt-1">Used on the PDFs for this organisation.</p>
              </div>
              <div className="col-span-2">
                <Select defaultValue="nz">
                  <SelectTrigger className="max-w-2xl h-10 border-slate-200 text-slate-700 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nz">(en-NZ) New Zealand English</SelectItem>
                    <SelectItem value="us">(en-US) US English</SelectItem>
                    <SelectItem value="uk">(en-GB) British English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Logo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Logo</h3>
                <p className="text-sm text-slate-500 mt-1">Used on the generated PDF's, such as Agenda, Board Pack, Minutes, etc.</p>
              </div>
              <div className="col-span-2">
                <div className="max-w-2xl border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-8 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
                  <Plus className="w-5 h-5 text-slate-400 mb-3" />
                  <p className="text-sm text-slate-600 mb-2">
                    Drag and drop your files here, or <span className="text-blue-600 font-medium">click to browse</span>
                  </p>
                  <p className="text-xs text-slate-400">Recommended dimensions: 200px x 100px, 1MB limit.</p>
                  <p className="text-xs text-slate-400 mt-1">Allowed types: .png, .jpeg, .jpg, .gif</p>
                </div>
              </div>
            </div>

            {/* Icon */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6 pb-2">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Icon</h3>
                <p className="text-sm text-slate-500 mt-1">Used in the web and application interfaces.</p>
              </div>
              <div className="col-span-2">
                <div className="max-w-2xl border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-8 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
                  <Plus className="w-5 h-5 text-slate-400 mb-3" />
                  <p className="text-sm text-slate-600 mb-2">
                    Drag and drop your files here, or <span className="text-blue-600 font-medium">click to browse</span>
                  </p>
                  <p className="text-xs text-slate-400">Recommended dimensions: 84px x 84px, 1MB limit.</p>
                  <p className="text-xs text-slate-400 mt-1">Allowed types: .png, .jpeg, .jpg, .gif</p>
                </div>
              </div>
            </div>

          </div>
        </TabsContent>
        
        {/* Quorum & Participation Settings */}
        <TabsContent value="quorum" className="mt-0">
          <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-lg p-4 md:p-8 shadow-sm">
            
            {/* Rule Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6 first:pt-0">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Default Quorum Rule</h3>
                <p className="text-sm text-slate-500 mt-1">
                  How quorum requirements are calculated for meetings by default. Individual meetings can also override this.
                </p>
              </div>
              <div className="col-span-2 space-y-4">
                <Select value={quorumType} onValueChange={(val) => setQuorumType(val || "MAJORITY")}>
                  <SelectTrigger className="w-full max-w-2xl h-10 border-slate-200 text-slate-700 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="w-full min-w-[320px] max-w-2xl">
                    <SelectItem value="MAJORITY">Simple Majority (50% + 1 of eligible members)</SelectItem>
                    <SelectItem value="PERCENTAGE">Custom Percentage of eligible members</SelectItem>
                    <SelectItem value="FIXED">Fixed minimum attendee count</SelectItem>
                  </SelectContent>
                </Select>

                {quorumType === "PERCENTAGE" && (
                  <div className="space-y-1.5 max-w-sm">
                    <label className="text-xs font-medium text-slate-600">Required Percentage (%)</label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={defaultQuorumPercentage}
                      onChange={(e) => setDefaultQuorumPercentage(e.target.value)}
                      placeholder="e.g. 50"
                      className="h-10 border-slate-200"
                    />
                  </div>
                )}

                {quorumType === "FIXED" && (
                  <div className="space-y-1.5 max-w-sm">
                    <label className="text-xs font-medium text-slate-600">Minimum Required Attendees Count</label>
                    <Input
                      type="number"
                      min={1}
                      value={defaultQuorumCount}
                      onChange={(e) => setDefaultQuorumCount(e.target.value)}
                      placeholder="e.g. 5"
                      className="h-10 border-slate-200"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Participation Standards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Participation Tracking</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Participation rate measures the ratio of present and participating attendees relative to total eligible members.
                </p>
              </div>
              <div className="col-span-2">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-sm text-slate-700 max-w-2xl">
                  <div className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                    Governance Standard Formula
                  </div>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">Participation (%) =</span> (Present + Remote + Late Attendees) / Total Eligible Members × 100
                  </p>
                  <p className="text-xs text-slate-500">
                    Members marked as Excused or Absent are tracked in the meeting record and audit log.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security" className="mt-0">
          <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-lg p-4 md:p-8 shadow-sm">
            
            {/* Session Management */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6 first:pt-0">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  Active Sessions & Inactivity
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Manage active browser sessions and automatic timeout after inactivity.
                </p>
              </div>
              <div className="col-span-2 space-y-5">
                <div className="space-y-1.5 max-w-sm">
                  <label className="text-xs font-medium text-slate-600">Session Inactivity Timeout</label>
                  <Select value={sessionTimeout} onValueChange={(val) => setSessionTimeout(val || "15")}>
                    <SelectTrigger className="w-full h-10 border-slate-200 text-slate-700 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="w-full min-w-[240px]">
                      <SelectItem value="15">15 minutes (Recommended)</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sessions List */}
                <div className="border border-slate-200 rounded-lg overflow-hidden max-w-2xl bg-white">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Active Device Sessions</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeOthersMutation.mutate()}
                      disabled={revokeOthersMutation.isPending || sessions.length <= 1}
                      className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      {revokeOthersMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <LogOut className="w-3.5 h-3.5 mr-1" />}
                      Revoke Other Sessions
                    </Button>
                  </div>

                  {isLoadingSessions ? (
                    <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
                  ) : sessions.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 text-center">No active sessions tracked.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {sessions.map((s: any) => (
                        <div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-slate-100 text-slate-600">
                              <Globe className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 flex items-center gap-2">
                                <span className="truncate max-w-[200px] sm:max-w-[300px]">{s.userAgent || 'Web Client'}</span>
                                {s.isCurrent && (
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                    Current Session
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 text-[11px] mt-0.5">
                                IP: {s.ipAddress} • Active: {new Date(s.lastActiveAt || s.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          {!s.isCurrent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => revokeSessionMutation.mutate(s.id)}
                              disabled={revokeSessionMutation.isPending}
                              className="text-xs h-7 text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5"
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Password Policy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-blue-600" />
                  Password Policy
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Enforce strict industrial password complexity standards across your organisation.
                </p>
              </div>
              <div className="col-span-2 space-y-4 max-w-2xl">
                <div className="space-y-1.5 max-w-sm">
                  <label className="text-xs font-medium text-slate-600">Minimum Password Length (12-20 chars)</label>
                  <Input
                    type="number"
                    min={12}
                    max={20}
                    value={minPasswordLength}
                    onChange={(e) => setMinPasswordLength(e.target.value)}
                    className="h-10 border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2.5 p-3 border rounded-lg bg-slate-50/50 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={requireUppercase}
                      onChange={(e) => setRequireUppercase(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    Require Uppercase Letters (A-Z)
                  </label>
                  <label className="flex items-center gap-2.5 p-3 border rounded-lg bg-slate-50/50 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={requireLowercase}
                      onChange={(e) => setRequireLowercase(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    Require Lowercase Letters (a-z)
                  </label>
                  <label className="flex items-center gap-2.5 p-3 border rounded-lg bg-slate-50/50 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={requireNumber}
                      onChange={(e) => setRequireNumber(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    Require Numbers (0-9)
                  </label>
                  <label className="flex items-center gap-2.5 p-3 border rounded-lg bg-slate-50/50 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={requireSpecialChar}
                      onChange={(e) => setRequireSpecialChar(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    Require Special Characters (!@#$%^&*)
                  </label>
                </div>
              </div>
            </div>

            {/* Login Protection & Account Lockout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Brute Force & Lockout
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Protect against credential attacks by temporarily locking accounts after repeated failed logins.
                </p>
              </div>
              <div className="col-span-2 space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Failed Login Attempt Threshold</label>
                    <Input
                      type="number"
                      min={3}
                      max={10}
                      value={failedLoginThreshold}
                      onChange={(e) => setFailedLoginThreshold(e.target.value)}
                      className="h-10 border-slate-200"
                    />
                    <p className="text-[11px] text-slate-400">Lock account after N consecutive wrong passwords</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Lockout Duration (Minutes)</label>
                    <Input
                      type="number"
                      min={5}
                      max={60}
                      value={lockoutDuration}
                      onChange={(e) => setLockoutDuration(e.target.value)}
                      className="h-10 border-slate-200"
                    />
                    <p className="text-[11px] text-slate-400">Temporary lock window before auto-unlocking</p>
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-800">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    Failed attempts reset to zero automatically upon successful authentication. Account unlock occurs automatically once the timeout expires.
                  </span>
                </div>
              </div>
            </div>

          </div>
        </TabsContent>
        
        {/* Notifications Preferences */}
        <TabsContent value="notifications" className="mt-0">
          <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-lg p-4 md:p-8 shadow-sm">
            
            {/* Delivery Channels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6 first:pt-0">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-blue-600" />
                  Delivery Channels
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Choose how SegueMeet delivers notifications to you.
                </p>
              </div>
              <div className="col-span-2 space-y-3 max-w-2xl">
                <label className="flex items-center justify-between p-3.5 border rounded-lg bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-xs font-semibold text-slate-800">In-App Notifications</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Show notifications in the topbar notification bell inbox</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={inAppEnabled}
                    onChange={(e) => setInAppEnabled(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 border rounded-lg bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Email Notifications</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Receive supported event notifications at your registered email address</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Meeting Notifications */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Meeting Notifications
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Notifications for invitations, schedule modifications, and cancellations.
                </p>
              </div>
              <div className="col-span-2 space-y-3 max-w-2xl">
                <label className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-medium text-slate-700">Meeting Invitations (when you are invited)</span>
                  <input
                    type="checkbox"
                    checked={meetingCreated}
                    onChange={(e) => setMeetingCreated(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-medium text-slate-700">Meeting Changes & Reschedules</span>
                  <input
                    type="checkbox"
                    checked={meetingUpdated}
                    onChange={(e) => setMeetingUpdated(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-medium text-slate-700">Meeting Cancellations</span>
                  <input
                    type="checkbox"
                    checked={meetingCancelled}
                    onChange={(e) => setMeetingCancelled(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Agenda & Documents */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Agenda & Board Pack
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Updates regarding meeting agenda publishing and uploaded materials.
                </p>
              </div>
              <div className="col-span-2 space-y-3 max-w-2xl">
                <label className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-medium text-slate-700">Agenda Published & Available</span>
                  <input
                    type="checkbox"
                    checked={agendaPublished}
                    onChange={(e) => setAgendaPublished(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-medium text-slate-700">Board Pack / Document Uploaded</span>
                  <input
                    type="checkbox"
                    checked={documentUploaded}
                    onChange={(e) => setDocumentUploaded(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Action Items & Governance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  Action Items & Governance
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Tasks, confirmed minutes, and governance reminders.
                </p>
              </div>
              <div className="col-span-2 space-y-3 max-w-2xl">
                <label className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-medium text-slate-700">Action Item Assigned to You</span>
                  <input
                    type="checkbox"
                    checked={actionItemAssigned}
                    onChange={(e) => setActionItemAssigned(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-medium text-slate-700">Meeting Minutes Confirmed</span>
                  <input
                    type="checkbox"
                    checked={minutesConfirmed}
                    onChange={(e) => setMinutesConfirmed(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-medium text-slate-700">Board Tenure Expiration Reminders</span>
                  <input
                    type="checkbox"
                    checked={tenureExpiring}
                    onChange={(e) => setTenureExpiring(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>

          </div>
        </TabsContent>
        
        <TabsContent value="audit" className="mt-0">
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
                System Audit Logs
              </h3>
              <p className="text-sm text-slate-500 mt-1">A chronological record of all system actions for compliance and tracking.</p>
            </div>
            
            {isLoadingAudit ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No audit logs found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b">
                    <tr>
                      <th className="px-6 py-3 font-medium">Timestamp</th>
                      <th className="px-6 py-3 font-medium">Actor</th>
                      <th className="px-6 py-3 font-medium">Action</th>
                      <th className="px-6 py-3 font-medium">Entity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-700">
                          {log.actor?.name || <span className="text-slate-400 italic">System</span>}
                        </td>
                        <td className="px-6 py-3">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-600">
                          {log.entityType} <span className="text-slate-400">({log.entityId.substring(0, 8)}...)</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Meeting Locations */}
        <TabsContent value="locations" className="mt-0">
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Saved Meeting Locations
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Manage physical, virtual, and hybrid locations available when scheduling meetings.
                </p>
              </div>
              <Button
                onClick={handleOpenNewLocation}
                className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Location
              </Button>
            </div>

            {isLoadingLocations ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : locations.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-medium text-slate-700">No meeting locations found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Add reusable board rooms, physical offices, or virtual meeting links to speed up meeting creation.
                </p>
                <Button
                  onClick={handleOpenNewLocation}
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Create First Location
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {locations.map((loc: any) => (
                  <div key={loc.id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-800 text-sm truncate">{loc.name}</span>
                        
                        {/* Type Badge */}
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          loc.type === 'VIRTUAL' 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : loc.type === 'HYBRID' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {loc.type === 'VIRTUAL' ? 'Virtual' : loc.type === 'HYBRID' ? 'Hybrid' : 'In-person'}
                        </span>

                        {/* Status Badge */}
                        {loc.isActive ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 font-medium px-1.5 py-0.5 rounded">
                            Inactive
                          </span>
                        )}

                        {/* Default Badge */}
                        {loc.isDefault && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-medium px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>

                      {/* Details: Address / Virtual Link */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {loc.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {loc.address}
                          </span>
                        )}
                        {loc.meetingUrl && (
                          <a
                            href={loc.meetingUrl.startsWith('http') ? loc.meetingUrl : `https://${loc.meetingUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Video className="w-3.5 h-3.5 text-blue-500" />
                            Meeting Link
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        )}
                      </div>

                      {loc.description && (
                        <p className="text-xs text-slate-400 line-clamp-1">{loc.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLocationActive(loc)}
                        disabled={updateLocationMutation.isPending}
                        className={`text-xs h-8 px-2.5 ${loc.isActive ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-700' : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
                      >
                        <Power className="w-3.5 h-3.5 mr-1" />
                        {loc.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditLocation(loc)}
                        className="text-xs h-8 px-2.5 text-slate-700"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLocation(loc.id)}
                        disabled={deleteLocationMutation.isPending}
                        className="text-xs h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add / Edit Location Dialog */}
      <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-800">
              {editingLocation ? 'Edit Meeting Location' : 'Add New Meeting Location'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveLocation} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Location Name *</label>
              <Input
                placeholder="e.g. Head Office – Board Room"
                value={locName}
                onChange={(e) => setLocName(e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Location Type *</label>
              <Select value={locType} onValueChange={(val: any) => setLocType(val)}>
                <SelectTrigger className="w-full h-10 border-slate-200 text-slate-700 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-full min-w-[240px]">
                  <SelectItem value="IN_PERSON">In-person (Physical Address)</SelectItem>
                  <SelectItem value="VIRTUAL">Virtual (Video Link / Teams / Zoom)</SelectItem>
                  <SelectItem value="HYBRID">Hybrid (Physical Room + Video Link)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {locType !== 'VIRTUAL' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Physical Address / Room Details {locType === 'IN_PERSON' ? '*' : ''}
                </label>
                <Input
                  placeholder="e.g. 4th Floor, Sector 62, Noida, India"
                  value={locAddress}
                  onChange={(e) => setLocAddress(e.target.value)}
                  required={locType === 'IN_PERSON'}
                  className="h-10"
                />
              </div>
            )}

            {locType !== 'IN_PERSON' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Meeting Video URL {locType === 'VIRTUAL' ? '*' : ''}
                </label>
                <Input
                  placeholder="e.g. https://teams.microsoft.com/l/meetup-join/..."
                  value={locMeetingUrl}
                  onChange={(e) => setLocMeetingUrl(e.target.value)}
                  required={locType === 'VIRTUAL'}
                  className="h-10"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Description (Optional)</label>
              <Input
                placeholder="e.g. Capacity 14 seats, projector and AV enabled"
                value={locDescription}
                onChange={(e) => setLocDescription(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={locIsDefault}
                  onChange={(e) => setLocIsDefault(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                Set as default location for new meetings
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={locIsActive}
                  onChange={(e) => setLocIsActive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                Active (available for new meetings)
              </label>
            </div>

            <DialogFooter className="pt-4 border-t flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLocationModalOpen(false)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLocationMutation.isPending || updateLocationMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9"
              >
                {createLocationMutation.isPending || updateLocationMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : null}
                {editingLocation ? 'Save Changes' : 'Create Location'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}