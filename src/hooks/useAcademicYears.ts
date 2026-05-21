import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AcademicYear {
  id: string;
  year_label: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicYearFormData {
  year_label: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

export function useAcademicYears() {
  return useQuery({
    queryKey: ["academic-years"],
    queryFn: () => api.get<{ success: boolean; data: AcademicYear[] }>("/academic-years"),
  });
}

export function useCreateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AcademicYearFormData) =>
      api.post<{ success: boolean; data: AcademicYear }>("/academic-years", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academic-years"] }),
  });
}

export function useUpdateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AcademicYearFormData> }) =>
      api.put<{ success: boolean; data: AcademicYear }>(`/academic-years/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academic-years"] }),
  });
}

export function useDeleteAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/academic-years/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academic-years"] }),
  });
}
