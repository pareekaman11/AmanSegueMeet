"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Calendar,
  CheckSquare,
  ListChecks,
  Send,
  Library,
  User,
  GitBranch,
  Tent,
  ClipboardList,
  Settings2,
  ChevronDown,
  Gem,
  PanelLeftClose,
  PanelLeftOpen,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { WorkspaceSelector } from "./workspace-selector";
import { useGetCommittees } from "@/hooks/use-committees";

const mainNav = [
  { label: "Search", href: "/search", icon: Search },
  { label: "Meetings", href: "/meetings", icon: Calendar },
  { label: "Actions", href: "/actions", icon: CheckSquare },
  { label: "Decisions", href: "/decisions", icon: ListChecks },
  { label: "Between Meetings", href: "/between-meetings", icon: Send },
  { label: "Documents", href: "/documents", icon: Library },
  { label: "People", href: "/people", icon: User },
  { label: "Interests", href: "/interests", icon: GitBranch },
  { label: "Committees", href: "/committees", icon: Tent },
  { label: "Annual Work Plan", href: "/annual-work-plan", icon: ClipboardList },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

export function SidebarInner({ isCollapsed = false, onToggleCollapse }: { isCollapsed?: boolean; onToggleCollapse?: () => void }) {
  const pathname = usePathname();
  const { user, setActiveOrgId } = useAuth();
  
  const [isAddBoardOpen, setIsAddBoardOpen] = useState(false);
  const [isAddCommitteeOpen, setIsAddCommitteeOpen] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [committeeName, setCommitteeName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const currentOrg = user?.memberships?.[0]?.organisation;

  const boards = user?.memberships?.map((m: any) => m.organisation).filter(Boolean) || [];
  const { data: committees = [] } = useGetCommittees(currentOrg?.id);

  const handleAddBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName) return;
    setIsLoading(true);
    try {
      await api.post("/organisations", { name: boardName });
      window.location.reload(); // Refresh to update user context with new board
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committeeName || !currentOrg) return;
    setIsLoading(true);
    try {
      await api.post("/committees", { name: committeeName, organisationId: currentOrg.id });
      setIsAddCommitteeOpen(false);
      setCommitteeName("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Top Header */}
      <div className={cn("flex h-16 items-center px-6 shrink-0", isCollapsed ? "justify-center px-0" : "justify-between")}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
             <span className="text-xl font-bold tracking-tight text-slate-900">
               SegueMeet
             </span>
          </div>
        )}
        {onToggleCollapse && (
          <button 
            onClick={onToggleCollapse}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
             {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 overflow-x-hidden">
        
        {/* Dashboard Link (Above Boards) */}
        <div>
          <Link
            href="/my-home"
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-[15px] transition-colors",
              isCollapsed ? "justify-center" : "gap-3",
              pathname === "/my-home"
                ? "bg-slate-200/60 font-medium text-slate-800"
                : "font-medium text-slate-700 hover:bg-slate-200/40"
            )}
            title={isCollapsed ? "Dashboard" : undefined}
          >
            <LayoutDashboard className={cn("h-5 w-5 shrink-0", pathname === "/my-home" ? "text-blue-600" : "text-slate-600")} />
            {!isCollapsed && "Dashboard"}
          </Link>
        </div>

        {/* Boards Section */}
        <div>
          {!isCollapsed && <h3 className="px-3 text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Boards</h3>}
          
          <WorkspaceSelector
            currentWorkspace={currentOrg?.name || "My Organisation"}
            currentWorkspaceId={currentOrg?.id || ""}
            boards={boards}
            committees={committees}
            userMemberships={user?.memberships || []}
            onSelectWorkspace={(id, name, type) => {
              if (type === 'board') {
                if (setActiveOrgId) {
                  setActiveOrgId(id);
                  window.location.reload();
                }
              } else {
                // If committee selected, maybe we want to change context? 
                // For now just route or reload as if it's the context
                // You mentioned a unified Workspace abstraction earlier, 
                // but this UI task doesn't change backend schemas yet.
                // Assuming it sets activeOrgId or similar, for now we log or just navigate:
                console.log("Selected committee:", id, name);
              }
            }}
            onAddBoard={() => setTimeout(() => setIsAddBoardOpen(true), 0)}
            onAddCommittee={() => setTimeout(() => setIsAddCommitteeOpen(true), 0)}
            isCollapsed={isCollapsed}
          />

          <nav className="space-y-1">
            {mainNav.map((item) => {
              const active = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 text-[15px] transition-colors",
                    isCollapsed ? "justify-center" : "gap-3",
                    active
                      ? "bg-slate-200/70 font-medium text-slate-900"
                      : "font-medium text-slate-700 hover:bg-slate-200/40"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", active ? "text-blue-600" : "text-slate-600")} />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Buy Now Button */}
      <div className={cn("p-4 mt-auto border-t border-slate-200 shrink-0", isCollapsed && "px-2")}>
        <button className={cn(
          "w-full flex items-center justify-center gap-2 bg-[#e0f0ff] hover:bg-[#d0e8ff] text-blue-900 font-medium rounded-xl transition-colors text-[15px]",
          isCollapsed ? "py-2" : "py-3"
        )}>
          <Gem className="w-5 h-5 text-blue-600 shrink-0" />
          {!isCollapsed && "Buy Now"}
        </button>
      </div>

      <Dialog open={isAddBoardOpen} onOpenChange={setIsAddBoardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Board</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBoard} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="boardName">Board Name</Label>
              <Input 
                id="boardName" 
                value={boardName} 
                onChange={(e) => setBoardName(e.target.value)} 
                placeholder="e.g. Acme Corp Board" 
                required 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddBoardOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? "Adding..." : "Add Board"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddCommitteeOpen} onOpenChange={setIsAddCommitteeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Committee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCommittee} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="committeeName">Committee Name</Label>
              <Input 
                id="committeeName" 
                value={committeeName} 
                onChange={(e) => setCommitteeName(e.target.value)} 
                placeholder="e.g. Audit Committee" 
                required 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddCommitteeOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? "Adding..." : "Add Committee"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <aside className={cn(
      "hidden md:flex h-screen flex-col border-r border-slate-200 bg-[#f4f7f9] relative transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <SidebarInner isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
    </aside>
  );
}