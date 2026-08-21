import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Fetch notifications
export function useGetNotifications(organisationId: string | undefined, options?: { isRead?: boolean }) {
  return useQuery({
    queryKey: ["notifications", organisationId, options?.isRead],
    queryFn: async () => {
      const res = await api.get(`/notifications`, {
        params: {
          ...(organisationId && { organisationId }),
          ...(options?.isRead !== undefined && { isRead: options.isRead }),
        }
      });
      return res.data;
    },
    refetchInterval: 30000, // Poll every 30s
  });
}

// Mark a single notification as read
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsAsRead(organisationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.patch(`/notifications/read-all`, undefined, {
        params: {
          ...(organisationId && { organisationId }),
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// Fetch user notification preferences
export function useGetNotificationPreferences() {
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await api.get("/notifications/preferences");
      return res.data;
    },
  });
}

// Update user notification preferences
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, boolean>) => {
      const res = await api.patch("/notifications/preferences", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });
}

