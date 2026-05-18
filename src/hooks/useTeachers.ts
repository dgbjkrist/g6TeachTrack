import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, BackendTeacher, PaginatedResponse, SingleResponse } from "@/lib/api";

export interface TeacherFormData {
  nom: string;
  prenom: string;
  grade: "Assistant" | "Maître-Assistant" | "Professeur";
  statut: "Permanent" | "Vacataire";
  departement: string;
  taux_horaire: number;
  email: string;
  telephone?: string;
}

export function useTeachers(params?: { search?: string; departement?: string; grade?: string }) {
  const query = new URLSearchParams();
  query.set("limit", "100");
  if (params?.search) query.set("search", params.search);
  if (params?.departement && params.departement !== "all") query.set("departement", params.departement);
  if (params?.grade && params.grade !== "all") query.set("grade", params.grade);

  return useQuery({
    queryKey: ["teachers", params],
    queryFn: () => api.get<PaginatedResponse<BackendTeacher>>(`/teachers?${query.toString()}`),
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TeacherFormData) =>
      api.post<SingleResponse<BackendTeacher>>("/teachers", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TeacherFormData> }) =>
      api.put<SingleResponse<BackendTeacher>>(`/teachers/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

export function useTeacherById(id: string | undefined) {
  return useQuery({
    queryKey: ["teachers", id],
    queryFn: () => api.get<SingleResponse<BackendTeacher>>(`/teachers/${id}`),
    enabled: !!id,
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/teachers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}
