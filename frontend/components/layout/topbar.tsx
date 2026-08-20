"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sparkles, Search, Bell, Check, Loader2, Menu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarInner } from "./sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { useGetNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/hooks/use-notifications";

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const orgId = user?.memberships?.[0]?.organisationId;
  const { data: notifications = [], isLoading } = useGetNotifications(orgId);
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead(orgId);

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 md:px-8 shrink-0">
      <div className="flex-1 flex items-center gap-4">
        {/* Mobile Hamburger Menu */}
        <Sheet>
          <SheetTrigger render={<button className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors" />}>
            <Menu className="w-6 h-6" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 flex flex-col bg-[#f4f7f9]">
            <SidebarInner isCollapsed={false} />
          </SheetContent>
        </Sheet>
        {/* Can put breadcrumbs or global search here if needed */}
      </div>

      <div className="flex items-center space-x-3 md:space-x-6 text-sm font-medium text-slate-600">
        <button 
          onClick={() => router.push('/search')}
          className="hidden md:flex hover:text-slate-900 transition-colors items-center gap-2"
        >
          <Search className="w-4 h-4" />
        </button>
        <Link href="#" className="hidden md:inline-flex hover:text-slate-900 transition-colors">
          Feedback
        </Link>
        <Link href="#" className="hidden md:inline-flex hover:text-slate-900 transition-colors">
          Support
        </Link>
        
        <DropdownMenu>
          <DropdownMenuTrigger 
            render={
              <button className="outline-none relative hover:text-slate-900 transition-colors flex items-center gap-2" />
            }
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
            </div>
            {isLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">No notifications</div>
            ) : (
              notifications.map((n: any) => (
                <div 
                  key={n.id} 
                  className={`px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                  onClick={() => !n.isRead && markAsRead.mutate(n.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-slate-800">{n.title}</span>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger render={<button className="outline-none" />}>
            <Avatar className="h-8 w-8 bg-blue-100 text-blue-700 hover:opacity-80 transition-opacity">
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt="Avatar" />}
              <AvatarFallback className="font-semibold text-xs">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col space-y-1 p-3 border-b mb-1">
              <p className="text-sm font-semibold leading-none text-slate-800">{user?.name}</p>
              <p className="text-xs leading-none text-slate-500 mt-1.5">{user?.email}</p>
            </div>
            
            <DropdownMenuItem className="cursor-pointer py-2 px-3 text-sm text-slate-700" onClick={() => router.push('/profile')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-2 px-3 text-sm text-slate-700 border-b" onClick={() => router.push('/profile?tab=organisations')}>
              My Organisations
            </DropdownMenuItem>
            
            <div className="py-1">
              <DropdownMenuItem className="cursor-pointer py-2 px-3 text-sm text-slate-700">Help</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-2 px-3 text-sm text-slate-700">Community</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-2 px-3 text-sm text-slate-700">Terms</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-2 px-3 text-sm text-slate-700">Privacy</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-2 px-3 text-sm text-slate-700 border-b">Contact</DropdownMenuItem>
            </div>

            <DropdownMenuItem className="cursor-pointer py-2 px-3 mt-1 text-sm text-red-600 focus:text-red-600 focus:bg-red-50" onClick={logout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}