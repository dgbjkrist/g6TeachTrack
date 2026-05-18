import { useAuth } from "@/contexts/AuthContext";
import { useTeachers } from "@/hooks/useTeachers";
import { useMyHours, useTeacherHours } from "@/hooks/useHours";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { BackendTeacher } from "@/lib/api";

function TeacherHoursRow({ teacher, quota }: { teacher: BackendTeacher; quota: number }) {
  const { data } = useTeacherHours(teacher.id);
  const hours = data?.data;
  const total = hours?.total ?? 0;
  const normales = hours?.normales ?? 0;
  const comp = hours?.complementaires ?? 0;
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
  const quota = hours?.quota ?? 240;
  const total = hours?.total ?? 0;
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
      <CardHeader className="pb-2"><CardTitle className="text-base">Mon volume horaire</CardTitle></CardHeader>
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
            <p className="text-2xl font-bold">{hours?.normales ?? 0}h</p>
            <p className="text-sm text-muted-foreground">Heures normales</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{hours?.complementaires ?? 0}h</p>
            <p className="text-sm text-muted-foreground">Complémentaires</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminView() {
  const { data: teachersData, isLoading } = useTeachers();
  const teachers = teachersData?.data ?? [];
  const quota = 240;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement...
      </div>
    );
  }

  return (
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
                <TeacherHoursRow key={t.id} teacher={t} quota={quota} />
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
