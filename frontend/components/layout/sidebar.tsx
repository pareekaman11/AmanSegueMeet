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
             <span className="text-xl font-bold tracking-tight text-white">
               SegueMeet
             </span>
          </div>
        )}
        {onToggleCollapse && (
          <button 
            onClick={onToggleCollapse}
            className="text-white/50 hover:text-white transition-colors"
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
              "group flex items-center rounded-xl px-3 py-2.5 text-[15px] transition-all duration-200",
              isCollapsed ? "justify-center" : "gap-3",
              pathname === "/my-home"
                ? "bg-white/10 font-medium text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                : "font-medium text-white/60 hover:bg-white/5 hover:text-white"
            )}
            title={isCollapsed ? "Dashboard" : undefined}
          >
            <LayoutDashboard className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-110 duration-300", pathname === "/my-home" ? "text-blue-400" : "text-white/50 group-hover:text-white/80")} />
            {!isCollapsed && "Dashboard"}
          </Link>
        </div>

        {/* Boards Section */}
        <div>
          {!isCollapsed && <h3 className="px-3 text-xs font-semibold text-white/40 mb-3 uppercase tracking-widest">Workspace</h3>}
          
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
                console.log("Selected committee:", id, name);
              }
            }}
            onAddBoard={() => setTimeout(() => setIsAddBoardOpen(true), 0)}
            onAddCommittee={() => setTimeout(() => setIsAddCommitteeOpen(true), 0)}
            isCollapsed={isCollapsed}
          />

          <nav className="space-y-1.5 mt-2">
            {mainNav.map((item) => {
              const active = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-xl px-3 py-2.5 text-[15px] transition-all duration-200",
                    isCollapsed ? "justify-center" : "gap-3",
                    active
                      ? "bg-white/10 font-medium text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                      : "font-medium text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-110 duration-300", active ? "text-blue-400" : "text-white/50 group-hover:text-white/80")} />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Buy Now Button */}
      <div className={cn("p-4 mt-auto border-t border-white/10 shrink-0", isCollapsed && "px-2")}>
        <button className={cn(
          "w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all duration-300 text-[15px] shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transform hover:-translate-y-0.5",
          isCollapsed ? "py-2" : "py-3"
        )}>
          <Gem className="w-5 h-5 text-white shrink-0" />
          {!isCollapsed && "Upgrade"}
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
      "hidden md:flex h-screen flex-col border-r border-white/10 bg-[#0f111a] relative transition-all duration-300 text-white/90 shadow-2xl z-20 backdrop-blur-xl",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <SidebarInner isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
    </aside>
  );
}