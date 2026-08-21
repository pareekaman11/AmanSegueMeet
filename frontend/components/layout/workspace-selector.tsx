'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRenameBoard, useDeleteBoard, useRenameCommittee, useDeleteCommittee } from '@/hooks/use-workspace-mutations';

export interface Board {
  id: string;
  name: string;
}

export interface Committee {
  id: string;
  name: string;
}

interface WorkspaceSelectorProps {
  currentWorkspace: string;
  currentWorkspaceId: string;
  boards: Board[];
  committees: Committee[];
  userMemberships?: { organisationId: string; role: string }[];
  onSelectWorkspace: (id: string, name: string, type: 'board' | 'committee') => void;
  onAddBoard: () => void;
  onAddCommittee: () => void;
  isCollapsed?: boolean;
}

export function WorkspaceSelector({
  currentWorkspace,
  currentWorkspaceId,
  boards,
  committees,
  userMemberships = [],
  onSelectWorkspace,
  onAddBoard,
  onAddCommittee,
  isCollapsed = false,
}: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const renameBoard = useRenameBoard();
  const deleteBoard = useDeleteBoard();
  const renameCommittee = useRenameCommittee();
  const deleteCommittee = useDeleteCommittee();

  const canManageBoard = (boardId: string) => {
    const membership = userMemberships.find(m => m.organisationId === boardId);
    return membership && ['BOARD_ADMIN', 'CHAIR', 'SECRETARY'].includes(membership.role);
  };

  const canDeleteBoard = (boardId: string) => {
    const membership = userMemberships.find(m => m.organisationId === boardId);
    return membership && membership.role === 'BOARD_ADMIN';
  };

  const canManageCommittee = () => {
    // Committees inherit permissions from the active workspace
    const membership = userMemberships.find(m => m.organisationId === currentWorkspaceId);
    return membership && ['BOARD_ADMIN', 'CHAIR', 'SECRETARY'].includes(membership.role);
  };

  // Filter boards and committees by search
  const filteredBoards = boards.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredCommittees = committees.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Get avatar color based on first letter
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-cyan-500',
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Dropdown Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center bg-white/5 border border-white/10 rounded-xl p-2 shadow-sm mb-4 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 hover:bg-white/10 hover:border-white/20 group",
          isCollapsed ? "w-10 h-10 justify-center mx-auto" : "w-full justify-between"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shrink-0 flex items-center justify-center text-white font-bold shadow-[0_0_10px_rgba(79,70,229,0.5)]",
            isCollapsed ? "w-6 h-6 text-[10px]" : "w-10 h-10 text-sm"
          )}>
            {currentWorkspace ? currentWorkspace.charAt(0).toUpperCase() : "W"}
          </div>
          {!isCollapsed && <span className="font-semibold text-white/90 text-[15px] whitespace-nowrap truncate">{currentWorkspace || "Select Workspace"}</span>}
        </div>
        {!isCollapsed && <ChevronDown className={cn("w-4 h-4 text-white/50 mr-1 shrink-0 transition-transform duration-300 group-hover:text-white/80", isOpen ? 'rotate-180' : '')} />}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={cn(
          "absolute mt-1 bg-[#161824]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden",
          isCollapsed ? "w-[260px] ml-[44px] -top-2 left-0" : "w-[260px] top-full left-0"
        )}>
          {/* Search Bar */}
          <div className="relative p-2 border-b border-white/10">
            <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search boards & committees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border-none bg-black/20 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 placeholder:text-white/30"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {/* Boards Section */}
            <div className="py-1">
              <div className="px-3 py-1.5 text-[11px] font-bold text-white/40 uppercase tracking-wider">
                Boards
              </div>
              {filteredBoards.length > 0 ? (
                <div className="flex flex-col px-1">
                  {filteredBoards.map((board) => (
                    <div
                      key={board.id}
                      className={cn(
                        "w-full px-2 py-2 text-left text-sm hover:bg-white/5 outline-none transition-colors rounded-lg flex items-center justify-between group",
                        currentWorkspaceId === board.id ? 'bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : ''
                      )}
                    >
                      <button
                        onClick={() => {
                          onSelectWorkspace(board.id, board.name, 'board');
                          setIsOpen(false);
                          setSearchQuery('');
                        }}
                        className="flex-1 flex items-center gap-3 overflow-hidden text-left"
                      >
                        <div className={cn(`w-6 h-6 ${getAvatarColor(board.name)} rounded-md flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm`)}>
                          {board.name.charAt(0).toUpperCase()}
                        </div>
                        {editingId === board.id ? (
                          <input
                            autoFocus
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                renameBoard.mutate({ boardId: board.id, name: editingName });
                                setEditingId(null);
                              } else if (e.key === 'Escape') {
                                setEditingId(null);
                              }
                            }}
                            className="px-2 py-1 border border-blue-500/50 rounded text-sm w-full bg-black/40 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className={cn("text-white/80 truncate group-hover:text-white transition-colors", currentWorkspaceId === board.id ? 'font-semibold text-white' : '')}>{board.name}</span>
                        )}
                      </button>

                      {/* Action Menu */}
                      {(canManageBoard(board.id) || canDeleteBoard(board.id)) && (
                        <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-2">
                          {canManageBoard(board.id) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(board.id);
                                setEditingName(board.name);
                              }}
                              className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white"
                              title="Rename"
                            >
                              ✏️
                            </button>
                          )}
                          {canDeleteBoard(board.id) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete "${board.name}"? This cannot be undone.`)) {
                                  deleteBoard.mutate(board.id);
                                }
                              }}
                              className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-2 text-xs text-white/30 italic">No boards found</div>
              )}
            </div>

            <div className="h-px bg-white/10 mx-2 my-1"></div>

            {/* Committees Section */}
            <div className="py-1">
              <div className="px-3 py-1.5 text-[11px] font-bold text-white/40 uppercase tracking-wider">
                Committees
              </div>
              {filteredCommittees.length > 0 ? (
                <div className="flex flex-col px-1">
                  {filteredCommittees.map((committee) => (
                    <div
                      key={committee.id}
                      className={cn(
                        "w-full px-2 py-2 text-left text-sm hover:bg-white/5 outline-none transition-colors rounded-lg flex items-center justify-between group",
                        currentWorkspaceId === committee.id ? 'bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : ''
                      )}
                    >
                      <button
                        onClick={() => {
                          onSelectWorkspace(committee.id, committee.name, 'committee');
                          setIsOpen(false);
                          setSearchQuery('');
                        }}
                        className="flex-1 flex items-center gap-3 overflow-hidden text-left"
                      >
                        <div className={cn(`w-6 h-6 bg-slate-800 rounded-md flex items-center justify-center text-white/60 text-[11px] font-bold shrink-0 border border-white/10`)}>
                          {committee.name.charAt(0).toUpperCase()}
                        </div>
                        {editingId === committee.id ? (
                          <input
                            autoFocus
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                renameCommittee.mutate({ committeeId: committee.id, name: editingName });
                                setEditingId(null);
                              } else if (e.key === 'Escape') {
                                setEditingId(null);
                              }
                            }}
                            className="px-2 py-1 border border-blue-500/50 rounded text-sm w-full bg-black/40 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className={cn("text-white/80 truncate group-hover:text-white transition-colors", currentWorkspaceId === committee.id ? 'font-semibold text-white' : '')}>{committee.name}</span>
                        )}
                      </button>

                      {/* Action Menu */}
                      {canManageCommittee() && (
                        <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(committee.id);
                              setEditingName(committee.name);
                            }}
                            className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white"
                            title="Rename"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete "${committee.name}"? This cannot be undone.`)) {
                                deleteCommittee.mutate(committee.id);
                              }
                            }}
                            className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-2 text-xs text-white/30 italic">No committees found</div>
              )}
            </div>
          </div>

          {/* Add Actions */}
          <div className="p-2 border-t border-white/10 bg-black/20 space-y-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onAddBoard();
              }}
              className="w-full flex items-center gap-2 px-2 py-2 text-sm text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 rounded-lg transition-colors"
            >
              <div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center">
                <Plus className="w-3 h-3 text-blue-400" />
              </div>
              <span className="font-medium">Add new Board</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
