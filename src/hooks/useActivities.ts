import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, BackendActivity, PaginatedResponse } from "@/lib/api";

export function useActivities(params?: { statut?: string; enseignant_id?: string; academic_year_id?: string }) {
  const query = new URLSearchParams();
  query.set("limit", "100");
  if (params?.statut && params.statut !== "all") query.set("statut", params.statut);
  if (params?.enseignant_id) query.set("enseignant_id", params.enseignant_id);
  if (params?.academic_year_id) query.set("academic_year_id", params.academic_year_id);

  return useQuery({
    queryKey: ["activities", params],
    queryFn: () => api.get<PaginatedResponse<BackendActivity>>(`/activities?${query.toString()}`),
  });
}

export function useValidateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: "Validée" | "Rejetée" }) =>
      api.put(`/activities/${id}/validate`, { statut }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      qc.invalidateQueries({ queryKey: ["hours"] });
    },
  });
}
