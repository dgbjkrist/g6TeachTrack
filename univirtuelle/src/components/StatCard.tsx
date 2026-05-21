import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, className = "" }: StatCardProps) {
  return (
    <div className={`stat-card ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            trend.value >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}
