import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useSubmitSupportRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      organisationId: string;
      category: string;
      subject: string;
      description: string;
      priority?: "LOW" | "MEDIUM" | "HIGH";
    }) => {
      const res = await api.post("/support-requests", data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["support-requests", variables.organisationId] });
    },
  });
}

export function useGetSupportRequests(organisationId: string | undefined) {
  return useQuery({
    queryKey: ["support-requests", organisationId],
    queryFn: async () => {
      if (!organisationId) return [];
      const res = await api.get("/support-requests", {
        params: { organisationId },
      });
      return res.data;
    },
    enabled: !!organisationId,
  });
}
