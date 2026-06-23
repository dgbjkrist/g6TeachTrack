import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Payment {
  id: string;
  teacher_id: string;
  academic_year_id: string | null;
  total_heures: number;
  heures_complementaires: number;
  montant_total: number;
  status: "en_attente" | "paye" | "payé" | "annulé";
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  teacher?: { id: string; nom: string; prenom: string };
  academicYear?: { id: string; year_label: string } | null;
}

export interface PaymentFilters {
  teacher_id?: string;
  academic_year_id?: string;
  status?: string;
}

export function usePayments(filters?: PaymentFilters) {
  const params = new URLSearchParams();
  if (filters?.teacher_id) params.set("teacher_id", filters.teacher_id);
  if (filters?.academic_year_id) params.set("academic_year_id", filters.academic_year_id);
  if (filters?.status && filters.status !== "all") params.set("status", filters.status);
  const qs = params.toString();

  return useQuery({
    queryKey: ["payments", filters],
    queryFn: () => api.get<{ success: boolean; data: Payment[] }>(`/payments${qs ? `?${qs}` : ""}`),
  });
}

export function useGeneratePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { teacher_id: string; academic_year_id?: string }) =>
      api.post<{ success: boolean; data: Payment }>("/payments/generate", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });
}

export function useUpdatePaymentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      payment_date,
      notes,
    }: {
      id: string;
      status: string;
      payment_date?: string;
      notes?: string;
    }) => api.put<{ success: boolean; data: Payment }>(`/payments/${id}`, { status, payment_date, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });
}

export function useRecalculatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.put<{ success: boolean; data: Payment }>(`/payments/${id}/recalculate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });
}

export interface PaymentPreview {
  totalHeures: number;
  heuresNormales: number;
  heuresComplementaires: number;
  quota: number;
  montantTotal: number;
  taux_horaire: number;
  academic_year_id: string | null;
}

export function usePaymentPreview(teacherId: string, academicYearId?: string) {
  const params = new URLSearchParams({ teacher_id: teacherId });
  if (academicYearId && academicYearId !== "__none__") params.set("academic_year_id", academicYearId);
  return useQuery({
    queryKey: ["payment-preview", teacherId, academicYearId],
    queryFn: () =>
      api.get<{ success: boolean; data: PaymentPreview }>(`/payments/preview?${params}`),
    enabled: !!teacherId,
  });
}
export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/payments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });
}
