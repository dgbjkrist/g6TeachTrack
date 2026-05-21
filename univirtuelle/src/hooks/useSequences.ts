import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, BackendSequence, ListResponse, SingleResponse } from "@/lib/api";

export function useSequences(courseId: string | undefined) {
  return useQuery({
    queryKey: ["sequences", courseId],
    queryFn: () => api.get<ListResponse<BackendSequence>>(`/sequences/course/${courseId}`),
    enabled: !!courseId,
  });
}

export function useCreateSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { course_id: string; titre: string; ordre: number }) =>
      api.post<SingleResponse<BackendSequence>>("/sequences", data),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["sequences", vars.course_id] }),
  });
}

export function useUpdateSequence(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { titre?: string; ordre?: number } }) =>
      api.put<SingleResponse<BackendSequence>>(`/sequences/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sequences", courseId] }),
  });
}

export function useDeleteSequence(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/sequences/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sequences", courseId] }),
  });
}
