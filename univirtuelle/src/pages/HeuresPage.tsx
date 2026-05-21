import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTeachers } from "@/hooks/useTeachers";
import { useMyHours, useTeacherHours } from "@/hooks/useHours";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CalendarDays } from "lucide-react";
import { BackendTeacher } from "@/lib/api";

function TeacherHoursRow({ teacher, quota, academicYearId }: { teacher: BackendTeacher; quota: number; academicYearId?: string }) {
  const { data } = useTeacherHours(teacher.id, academicYearId);
  const hours = data?.data;
  const total = Number(hours?.total ?? 0);
  const normales = Number(hours?.normales ?? 0);
  const comp = Number(hours?.complementaires ?? 0);
  const pct = Math.min((total / quota) * 100, 100);

  return (
    <TableRow>
      <TableCell className="font-medium">{teacher.prenom} {teacher.nom}</TableCell>
      <TableCell>{teacher.departement}</TableCell>
      <TableCell>{teacher.grade}</TableCell>
      <TableCell className="text-right font-medium">{total}h</TableCell>
      <TableCell className="text-right">{normales}h</TableCell>
      <TableCell className="text-right">{comp}h</TableCell>
      <TableCell className="w-32"><Progress value={pct} className="h-2" /></TableCell>
      <TableCell>
        <Badge variant={comp > 0 ? "destructive" : "default"}>
          {comp > 0 ? "Dépassement" : "Normal"}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

function EnseignantView() {
  const { data, isLoading } = useMyHours();
  const hours = data?.data;
  const quota = Number(hours?.quota ?? 240);
  const total = Number(hours?.total ?? 0);
  const pct = Math.min((total / quota) * 100, 100);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement...
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Mon volume horaire</CardTitle>
          {hours?.academicYear && (
            <Badge variant="outline" className="gap-1 text-xs">
              <CalendarDays className="h-3 w-3" />
              {hours.academicYear.year_label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span>Progression</span>
          <span className="font-medium">{total}h / {quota}h</span>
        </div>
        <Progress value={pct} className="h-3" />
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{total}h</p>
            <p className="text-sm text-muted-foreground">Heures totales</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{Number(hours?.normales ?? 0)}h</p>
            <p className="text-sm text-muted-foreground">Heures normales</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{Number(hours?.complementaires ?? 0)}h</p>
            <p className="text-sm text-muted-foreground">Complémentaires</p>
          </div>
        </div>
        {!hours?.academicYear && (
          <p className="text-xs text-muted-foreground text-center">
            Aucune année académique active — toutes les heures sont affichées.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AdminView() {
  const { data: yearsData } = useAcademicYears();
  const years = yearsData?.data ?? [];
  const activeYear = years.find((y) => y.is_active);

  const [selectedYearId, setSelectedYearId] = useState<string>("all");
  const defaultSet = useRef(false);
  useEffect(() => {
    if (!defaultSet.current && activeYear) {
      setSelectedYearId(activeYear.id);
      defaultSet.current = true;
    }
  }, [activeYear]);

  const { data: teachersData, isLoading } = useTeachers();
  const teachers = teachersData?.data ?? [];
  const quota = 240;

  const selectedYear = years.find((y) => y.id === selectedYearId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {selectedYear
            ? <>Heures de l'année <strong>{selectedYear.year_label}</strong></>
            : "Toutes les années confondues"}
        </p>
        <Select value={selectedYearId} onValueChange={setSelectedYearId}>
          <SelectTrigger className="w-44 h-8 text-sm"><SelectValue placeholder="Année" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les années</SelectItem>
            {years.map((y) => (
              <SelectItem key={y.id} value={y.id}>
                {y.year_label}{y.is_active ? " ★" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Heures totales</TableHead>
                  <TableHead className="text-right">H. normales</TableHead>
                  <TableHead className="text-right">H. complémentaires</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((t) => (
                  <TeacherHoursRow
                    key={t.id}
                    teacher={t}
                    quota={quota}
                    academicYearId={selectedYearId !== "all" ? selectedYearId : undefined}
                  />
                ))}
                {teachers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Aucun enseignant
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HeuresPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Suivi des heures</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Volume horaire calculé à partir des activités validées
        </p>
      </div>
      {user?.role === "enseignant" ? <EnseignantView /> : <AdminView />}
    </div>
  );
}
