import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Decisions ─────────────────────────────────────────────────────────────

export function useGetDecisions(organisationId: string | undefined) {
  return useQuery({
    queryKey: ["decisions", organisationId],
    queryFn: async () => {
      if (!organisationId) return [];
      const res = await api.get(`/decisions`, { params: { organisationId } });
      return res.data.data || [];
    },
    enabled: !!organisationId,
  });
}

export function useGetDecisionById(decisionId: string | undefined) {
  return useQuery({
    queryKey: ["decision", decisionId],
    queryFn: async () => {
      if (!decisionId) return null;
      const res = await api.get(`/decisions/${decisionId}`);
      return res.data;
    },
    enabled: !!decisionId,
  });
}

export function useGetDecisionVoteSummary(decisionId: string | undefined) {
  return useQuery({
    queryKey: ["decision-votes", decisionId],
    queryFn: async () => {
      if (!decisionId) return null;
      const res = await api.get(`/decisions/${decisionId}/votes/summary`);
      return res.data;
    },
    enabled: !!decisionId,
  });
}

export function useCreateDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/decisions", data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["decisions", variables.organisationId] });
    },
  });
}

export function useUpdateDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await api.patch(`/decisions/${id}`, data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["decision", data.id] });
      queryClient.invalidateQueries({ queryKey: ["decisions", data.organisationId] });
    },
  });
}

export function useCloseDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/votes/decision/${id}/close`);
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["decision", variables] });
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
    },
  });
}

export function useCloseResolution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/votes/resolution/${id}/close`);
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["resolutions"] });
    },
  });
}

export function useCastDecisionVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ decisionId, ...data }: any) => {
      const res = await api.post(`/votes/decision/${decisionId}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["decision", variables.decisionId] });
      queryClient.invalidateQueries({ queryKey: ["decision-votes", variables.decisionId] });
    },
  });
}

// ─── Resolutions ───────────────────────────────────────────────────────────

export function useGetResolutions(organisationId: string | undefined) {
  return useQuery({
    queryKey: ["resolutions", organisationId],
    queryFn: async () => {
      if (!organisationId) return [];
      const res = await api.get(`/resolutions`, { params: { organisationId } });
      return res.data || [];
    },
    enabled: !!organisationId,
  });
}

export function useCreateResolution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/resolutions", data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["resolutions", variables.organisationId] });
    },
  });
}

export function useCastResolutionVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ resolutionId, status }: any) => {
      const res = await api.post(`/votes/resolution/${resolutionId}`, { vote: status });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["resolutions"] });
    },
  });
}
