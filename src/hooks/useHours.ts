import { useQuery } from "@tanstack/react-query";
import { api, HoursData, SingleResponse } from "@/lib/api";

function getCachedUserId(): string | null {
  try { return JSON.parse(localStorage.getItem("auth_user") ?? "{}").id ?? null; }
  catch { return null; }
}

export function useMyHours() {
  const userId = getCachedUserId();
  return useQuery({
    queryKey: ["hours", "me", userId],
    queryFn: () => api.get<SingleResponse<HoursData>>("/hours/me"),
    enabled: !!userId,
  });
}

export function useTeacherHours(teacherId: string | undefined) {
  return useQuery({
    queryKey: ["hours", teacherId],
    queryFn: () => api.get<SingleResponse<HoursData>>(`/hours/teacher/${teacherId}`),
    enabled: !!teacherId,
  });
}
