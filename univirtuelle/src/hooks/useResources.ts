import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, BackendResource, ListResponse, SingleResponse } from "@/lib/api";

export interface ResourceFormData {
  titre: string;
  type: string;
  description?: string;
  complexite: "Faible" | "Moyen" | "Élevé";
  contenu_texte?: string;
  video_url?: string;
  document_url?: string;
  evaluation_url?: string;
  quiz?: unknown[];
  course_id: string;
  sequence_id?: string | null;
}

export function useResources(courseId: string | undefined) {
  return useQuery({
    queryKey: ["resources", courseId],
    queryFn: () => api.get<ListResponse<BackendResource>>(`/resources/course/${courseId}`),
    enabled: !!courseId,
  });
}

export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ResourceFormData) =>
      api.post<SingleResponse<BackendResource>>("/resources", data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["resources", vars.course_id] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUpdateResource(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ResourceFormData> }) =>
      api.put<SingleResponse<BackendResource>>(`/resources/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources", courseId] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useDeleteResource(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/resources/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources", courseId] }),
  });
}
