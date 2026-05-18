import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, BackendNotification, ListResponse } from "@/lib/api";

function getCachedUserId(): string | null {
  try { return JSON.parse(localStorage.getItem("auth_user") ?? "{}").id ?? null; }
  catch { return null; }
}

export function useNotifications() {
  const userId = getCachedUserId();
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => api.get<ListResponse<BackendNotification>>("/notifications"),
    enabled: !!userId,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
