"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface InterestsRegisterTabProps {
  organisationId: string;
}

export function InterestsRegisterTab({ organisationId }: InterestsRegisterTabProps) {
  const [filter, setFilter] = useState<"current" | "past">("current");
  const [selectedPerson, setSelectedPerson] = useState<string>("all");

  const { data: interests = [], isLoading } = useQuery({
    queryKey: ["interests", organisationId],
    queryFn: async () => {
      const res = await api.get(`/interests`, {
        params: { organisationId }
      });
      return res.data;
    },
    enabled: !!organisationId,
  });

  const filteredInterests = interests.filter((interest: any) => {
    const isCurrent = !interest.isResolved;
    if (filter === "current" && !isCurrent) return false;
    if (filter === "past" && isCurrent) return false;
    if (selectedPerson !== "all") {
      if (selectedPerson.startsWith("guest:")) {
        if (interest.guestName !== selectedPerson.replace("guest:", "")) return false;
      } else {
        if (interest.userId !== selectedPerson) return false;
      }
    }
    return true;
  });

  // Extract unique people for the dropdown
  const uniqueUsers = Array.from(new Set(interests.map((i: any) => i.user?.id).filter(Boolean))).map(id => {
    return interests.find((i: any) => i.user?.id === id)?.user;
  }).filter(Boolean);

  const uniqueGuests = Array.from(new Set(interests.map((i: any) => i.guestName).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Filters row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-2 border-b">
        <div className="flex border rounded-md overflow-hidden bg-white shadow-sm p-1 w-full sm:w-auto">
          <button 
            onClick={() => setFilter("current")}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === "current" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Current
          </button>
          <button 
            onClick={() => setFilter("past")}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === "past" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Past
          </button>
          <button className="px-3 py-1.5 text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </button>
        </div>

        <select 
          value={selectedPerson}
          onChange={e => setSelectedPerson(e.target.value)}
          className="border rounded-md px-3 py-1.5 h-[36px] text-sm text-slate-700 bg-white shadow-sm w-48 outline-none"
        >
          <option value="all">Person</option>
          {uniqueUsers.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
          {uniqueGuests.map((g: any) => (
            <option key={`guest:${g}`} value={`guest:${g}`}>{g}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filteredInterests.length === 0 ? (
        <div className="py-12 text-slate-500">
          Sorry, No results!
        </div>
      ) : (
        <div className="border rounded-xl bg-white shadow-sm w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="bg-gray-50 text-slate-500 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Person</th>
                <th className="px-6 py-4 font-medium">Organisation</th>
                <th className="px-6 py-4 font-medium">Nature of Interest</th>
                <th className="px-6 py-4 font-medium">Notification Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInterests.map((interest: any) => (
                <tr key={interest.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{interest.user?.name || interest.guestName}</td>
                  <td className="px-6 py-4">{interest.title}</td>
                  <td className="px-6 py-4 text-slate-600">{interest.description}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {interest.notificationDate ? new Date(interest.notificationDate).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    }) : '-'}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
