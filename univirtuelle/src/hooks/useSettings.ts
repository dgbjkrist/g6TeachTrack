import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, AppSettings } from "@/lib/api";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<{ success: boolean; data: AppSettings }>("/settings"),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AppSettings>) =>
      api.put<{ success: boolean; message: string }>("/settings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}
