import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, BackendCourse, PaginatedResponse, SingleResponse } from "@/lib/api";

export interface CourseFormData {
  intitule: string;
  filiere: string;
  niveau: "L1" | "L2" | "L3" | "M1" | "M2";
  semestre: 1 | 2;
  nombre_heures: number;
  credits: number;
}

export function useCourses(params?: { search?: string; filiere?: string; niveau?: string; academic_year_id?: string }) {
  const query = new URLSearchParams();
  query.set("limit", "100");
  if (params?.filiere && params.filiere !== "all") query.set("filiere", params.filiere);
  if (params?.niveau && params.niveau !== "all") query.set("niveau", params.niveau);
  if (params?.academic_year_id) query.set("academic_year_id", params.academic_year_id);

  return useQuery({
    queryKey: ["courses", params],
    queryFn: () => api.get<PaginatedResponse<BackendCourse>>(`/courses?${query.toString()}`),
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CourseFormData) =>
      api.post<SingleResponse<BackendCourse>>("/courses", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CourseFormData> }) =>
      api.put<SingleResponse<BackendCourse>>(`/courses/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useAssignTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, teacherId }: { courseId: string; teacherId: string }) =>
      api.post(`/courses/${courseId}/teachers/${teacherId}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useRemoveTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, teacherId }: { courseId: string; teacherId: string }) =>
      api.delete(`/courses/${courseId}/teachers/${teacherId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export interface CarryOverResult {
  created: number;
  skipped: number;
  message: string;
  from_year: string;
  to_year: string;
}

export function useCarryOverAttributions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ success: boolean } & CarryOverResult>("/courses/carry-over", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}
