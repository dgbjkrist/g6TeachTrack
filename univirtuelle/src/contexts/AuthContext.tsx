import React, { createContext, useContext, useState, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, AuthResponse } from "@/lib/api";

export type UserRole = "admin" | "secretaire" | "enseignant";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  teacher_id: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("auth_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const data = await api.post<AuthResponse>("/auth/login", { email: normalizedEmail, password });
      if (data.success) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          teacher_id: data.user.teacher_id,
        };
        setUser(userData);
        localStorage.setItem("auth_user", JSON.stringify(userData));
        localStorage.setItem("token", data.token);
        return { success: true };
      }
      return { success: false, error: "Email ou mot de passe incorrect" };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Email ou mot de passe incorrect";
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("token");
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
