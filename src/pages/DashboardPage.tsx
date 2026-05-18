import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/StatCard";
import { useTeachers } from "@/hooks/useTeachers";
import { useActivities } from "@/hooks/useActivities";
import { useCourses } from "@/hooks/useCourses";
import { useMyHours } from "@/hooks/useHours";
import { Users, Clock, BookOpen, AlertTriangle, FileText, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(230,80%,56%)", "hsl(142,72%,40%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)"];

function AdminDashboard() {
  const { data: teachersData } = useTeachers();
  const { data: activitiesData } = useActivities();
  const { data: coursesData } = useCourses();

  const teachers = teachersData?.data ?? [];
  const activities = activitiesData?.data ?? [];
  const courses = coursesData?.data ?? [];

  const activityTypeData = [
    { name: "Création", value: activities.filter((a) => a.type === "Création").length },
    { name: "Mise à jour", value: activities.filter((a) => a.type === "Mise à jour").length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Enseignants" value={teachers.length} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Cours" value={courses.length} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard title="Activités totales" value={activities.length} icon={<FileText className="h-5 w-5" />} />
        <StatCard
          title="En attente"
          value={activities.filter((a) => a.statut === "En attente").length}
          icon={<AlertTriangle className="h-5 w-5" />}
          subtitle="activités à valider"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Répartition des activités</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={activityTypeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {activityTypeData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Statut des activités</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { name: "En attente", count: activities.filter((a) => a.statut === "En attente").length },
                { name: "Validée", count: activities.filter((a) => a.statut === "Validée").length },
                { name: "Rejetée", count: activities.filter((a) => a.statut === "Rejetée").length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(230,80%,56%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Activités récentes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-accent-foreground">
                    {a.teacher?.prenom?.[0]}{a.teacher?.nom?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.teacher?.prenom} {a.teacher?.nom}</p>
                    <p className="text-xs text-muted-foreground">{a.resource?.titre ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{a.heures_calculees}h</span>
                  <Badge variant={a.statut === "Validée" ? "default" : a.statut === "En attente" ? "secondary" : "destructive"} className="text-xs">
                    {a.statut}
                  </Badge>
                </div>
              </div>
            ))}
            {activities.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune activité</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SecretaireDashboard() {
  const { data: teachersData } = useTeachers();
  const { data: activitiesData } = useActivities();

  const teachers = teachersData?.data ?? [];
  const activities = activitiesData?.data ?? [];
  const pendingCount = activities.filter((a) => a.statut === "En attente").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm mt-1">Suivi des activités — Secrétariat</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Enseignants actifs" value={teachers.length} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Activités en attente" value={pendingCount} icon={<FileText className="h-5 w-5" />} />
        <StatCard title="Activités validées" value={activities.filter((a) => a.statut === "Validée").length} icon={<CheckCircle className="h-5 w-5" />} />
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Activités en attente de validation</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.filter((a) => a.statut === "En attente").slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{a.teacher?.prenom} {a.teacher?.nom}</p>
                  <p className="text-xs text-muted-foreground">{a.type} — {a.resource?.titre ?? "—"}</p>
                </div>
                <Badge variant="secondary">{a.heures_calculees}h</Badge>
              </div>
            ))}
            {pendingCount === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune activité en attente</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EnseignantDashboard() {
  const { user } = useAuth();
  const { data: hoursData, isLoading } = useMyHours();
  const { data: activitiesData } = useActivities(
    user?.teacher_id ? { enseignant_id: user.teacher_id } : undefined
  );

  const hours = hoursData?.data;
  const activities = activitiesData?.data ?? [];
  const quota = hours?.quota ?? 240;
  const validated = activities.filter((a) => a.statut === "Validée").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mon tableau de bord</h1>
        <p className="text-muted-foreground text-sm mt-1">Suivi de mon activité pédagogique</p>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Volume horaire" value={`${hours?.total ?? 0}h`} icon={<Clock className="h-5 w-5" />} subtitle={`Seuil: ${quota}h`} />
          <StatCard title="Heures complémentaires" value={`${hours?.complementaires ?? 0}h`} icon={<BookOpen className="h-5 w-5" />} />
          <StatCard title="Activités validées" value={`${validated}/${activities.length}`} icon={<CheckCircle className="h-5 w-5" />} />
        </div>
      )}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Mes activités récentes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{a.resource?.titre ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{a.type} • {a.complexite} • {a.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{a.heures_calculees}h</span>
                  <Badge variant={a.statut === "Validée" ? "default" : "secondary"}>{a.statut}</Badge>
                </div>
              </div>
            ))}
            {activities.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune activité</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === "admin") return <AdminDashboard />;
  if (user?.role === "secretaire") return <SecretaireDashboard />;
  return <EnseignantDashboard />;
}
