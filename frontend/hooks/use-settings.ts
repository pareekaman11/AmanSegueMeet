import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Fetch organisation settings
export function useGetOrganisationSettings(organisationId: string | undefined) {
  return useQuery({
    queryKey: ["organisation", organisationId],
    queryFn: async () => {
      if (!organisationId) return null;
      const res = await api.get(`/organisations/${organisationId}`);
      return res.data;
    },
    enabled: !!organisationId,
  });
}

// Update organisation settings
export function useUpdateOrganisationSettings(organisationId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; settings?: any; organisationId?: string }) => {
      const activeOrgId = data.organisationId || organisationId;
      if (!activeOrgId) throw new Error("Organisation context is required");
      const res = await api.patch(`/organisations/${activeOrgId}`, {
        name: data.name,
        settings: data.settings,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      const activeOrgId = variables?.organisationId || organisationId;
      queryClient.invalidateQueries({ queryKey: ["organisation", activeOrgId] });
      queryClient.invalidateQueries({ queryKey: ["organisation"] });
    },
  });
}

// Fetch audit logs
export function useGetAuditLogs(organisationId: string | undefined) {
  return useQuery({
    queryKey: ["audit-logs", organisationId],
    queryFn: async () => {
      if (!organisationId) return [];
      const res = await api.get(`/organisations/${organisationId}/audit-logs`);
      return res.data;
    },
    enabled: !!organisationId,
  });
}

// Fetch active sessions
export function useGetSessions() {
  return useQuery({
    queryKey: ["auth-sessions"],
    queryFn: async () => {
      const res = await api.get("/auth/sessions");
      return res.data;
    },
  });
}

// Revoke a single session
export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await api.post(`/auth/sessions/${sessionId}/revoke`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
    },
  });
}

// Revoke all other sessions
export function useRevokeAllOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/auth/sessions/revoke-others");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
    },
  });
}

// Fetch meeting locations
export function useGetLocations(organisationId: string | undefined, activeOnly?: boolean) {
  return useQuery({
    queryKey: ["locations", organisationId, activeOnly],
    queryFn: async () => {
      if (!organisationId) return [];
      const res = await api.get(`/organisations/${organisationId}/locations`, {
        params: activeOnly ? { activeOnly: true } : {},
      });
      return res.data;
    },
    enabled: !!organisationId,
  });
}

// Create meeting location
export function useCreateLocation(organisationId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const activeOrgId = data.organisationId || organisationId;
      if (!activeOrgId) throw new Error("Organisation context is required");
      const { organisationId: _omitted, ...payload } = data;
      const res = await api.post(`/organisations/${activeOrgId}/locations`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

// Update meeting location
export function useUpdateLocation(organisationId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ locationId, data, organisationId: overrideOrgId }: { locationId: string; data: any; organisationId?: string }) => {
      const activeOrgId = overrideOrgId || data?.organisationId || organisationId;
      if (!activeOrgId) throw new Error("Organisation context is required");
      const { organisationId: _omitted, ...payload } = data || {};
      const res = await api.patch(`/organisations/${activeOrgId}/locations/${locationId}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

// Delete meeting location
export function useDeleteLocation(organisationId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { locationId: string; organisationId?: string } | string) => {
      const locId = typeof params === "string" ? params : params.locationId;
      const activeOrgId = (typeof params === "object" ? params.organisationId : undefined) || organisationId;
      if (!activeOrgId) throw new Error("Organisation context is required");
      const res = await api.delete(`/organisations/${activeOrgId}/locations/${locId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}



