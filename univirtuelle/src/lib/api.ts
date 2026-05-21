const BASE_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}`.replace(/\/$/, "");

export function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
  return data as T;
}

export async function fetchBlob(path: string): Promise<string> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function downloadFile(path: string, filename: string) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BackendTeacher {
  id: string;
  nom: string;
  prenom: string;
  grade: "Assistant" | "Maître-Assistant" | "Professeur";
  statut: "Permanent" | "Vacataire";
  departement: string;
  taux_horaire: number;
  email: string;
  telephone: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendCourse {
  id: string;
  intitule: string;
  filiere: string;
  niveau: "L1" | "L2" | "L3" | "M1" | "M2";
  semestre: 1 | 2;
  nombre_heures: number;
  credits: number;
  teachers: BackendTeacher[];
  created_at: string;
  updated_at: string;
}

export interface BackendResource {
  id: string;
  titre: string;
  type: string;
  description: string | null;
  complexite: "Faible" | "Moyen" | "Élevé";
  contenu_texte: string | null;
  video_url: string | null;
  document_url: string | null;
  evaluation_url: string | null;
  quiz: unknown[] | null;
  course_id: string;
  sequence_id: string | null;
  sequence?: { id: string; titre: string; ordre: number };
  created_at: string;
  updated_at: string;
}

export interface BackendSequence {
  id: string;
  titre: string;
  ordre: number;
  course_id: string;
  created_at: string;
  updated_at: string;
}

export interface BackendActivity {
  id: string;
  enseignant_id: string;
  resource_id: string;
  type: "Création" | "Mise à jour";
  complexite: "Faible" | "Moyen" | "Élevé";
  date: string;
  heures_calculees: string;
  statut: "En attente" | "Validée" | "Rejetée";
  valide_par: string | null;
  date_validation: string | null;
  teacher?: { id: string; nom: string; prenom: string };
  resource?: { id: string; titre: string; type: string };
  created_at: string;
  updated_at: string;
}

export interface HoursData {
  total: number;
  normales: number;
  complementaires: number;
  quota: number;
  academic_year_id: string | null;
  academicYear: { id: string; year_label: string } | null;
  activities: BackendActivity[];
}

export interface BackendAcademicYear {
  id: string;
  year_label: string;
  is_active: boolean;
}

export interface BackendNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    role: "admin" | "secretaire" | "enseignant";
    teacher_id: string | null;
    is_active: boolean;
  };
}
