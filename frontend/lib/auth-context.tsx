'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
import axios from 'axios';

export type UserRole = 'BOARD_ADMIN' | 'CHAIR' | 'SECRETARY' | 'BOARD_MEMBER' | 'EXECUTIVE' | 'GUEST';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  mobileNumber?: string | null;
  title?: string | null;
  suffix?: string | null;
  memberships: {
    organisationId: string;
    role: UserRole;
    organisation?: {
      id: string;
      name: string;
    };
  }[];
}

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (token: string, user: AuthenticatedUser) => void;
  logout: () => void;
  setActiveOrgId: (id: string) => void;
  activeOrgId: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  setActiveOrgId: () => {},
  activeOrgId: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('activeOrgId');
    if (saved) setActiveOrgIdState(saved);
  }, []);

  const setActiveOrgId = (id: string) => {
    setActiveOrgIdState(id);
    localStorage.setItem('activeOrgId', id);
  };

  const derivedUser = React.useMemo(() => {
    if (!user) return null;
    if (!activeOrgId) return user;
    const sortedMemberships = [...user.memberships].sort((a, b) => {
      if (a.organisationId === activeOrgId) return -1;
      if (b.organisationId === activeOrgId) return 1;
      return 0;
    });
    return { ...user, memberships: sortedMemberships };
  }, [user, activeOrgId]);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch current user details from backend
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (!error.response) {
            // Network error (backend unreachable)
            console.warn('[Auth] Backend unreachable, preserving session token');
          } else if (error.response.status === 401) {
            // Invalid token
            console.warn('[Auth] Session expired or invalid, clearing token');
            localStorage.removeItem('token');
          } else {
            console.error('[Auth] Failed to restore session:', error.message);
          }
        } else {
          console.error('[Auth] Failed to restore session:', error);
          localStorage.removeItem('token');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (token: string, userData: AuthenticatedUser) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeOrgId');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user: derivedUser, isLoading, login, logout, setActiveOrgId, activeOrgId }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
