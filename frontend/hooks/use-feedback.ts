import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      organisationId: string;
      type: "SUGGESTION" | "FEATURE_REQUEST" | "BUG" | "GENERAL";
      message: string;
      pageUrl?: string;
    }) => {
      const res = await api.post("/feedback", data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["feedback", variables.organisationId] });
    },
  });
}

export function useGetFeedbackList(organisationId: string | undefined) {
  return useQuery({
    queryKey: ["feedback", organisationId],
    queryFn: async () => {
      if (!organisationId) return [];
      const res = await api.get("/feedback", {
        params: { organisationId },
      });
      return res.data;
    },
    enabled: !!organisationId,
  });
}
