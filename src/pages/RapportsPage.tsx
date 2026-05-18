import { useTeachers } from "@/hooks/useTeachers";
import { useTeacherHours } from "@/hooks/useHours";
import { downloadFile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQueries } from "@tanstack/react-query";
import { api, SingleResponse, HoursData } from "@/lib/api";
import { BackendTeacher } from "@/lib/api";

function TeacherRow({ teacher }: { teacher: BackendTeacher }) {
  const { data } = useTeacherHours(teacher.id);
  const h = data?.data;
  return (
    <TableRow>
      <TableCell className="font-medium">{teacher.prenom} {teacher.nom}</TableCell>
      <TableCell>{teacher.grade}</TableCell>
      <TableCell>{teacher.departement}</TableCell>
      <TableCell className="text-right">{h?.total ?? "—"}h</TableCell>
      <TableCell className="text-right">{h?.normales ?? "—"}h</TableCell>
      <TableCell className="text-right">{h?.complementaires ?? "—"}h</TableCell>
      <TableCell className="text-right">{teacher.taux_horaire} DA</TableCell>
      <TableCell className="text-right font-medium">
        {h ? ((h.complementaires ?? 0) * teacher.taux_horaire).toLocaleString() + " DA" : "—"}
      </TableCell>
    </TableRow>
  );
}

export default function RapportsPage() {
  const { data: teachersData, isLoading } = useTeachers();
  const teachers = teachersData?.data ?? [];

  const hoursQueries = useQueries({
    queries: teachers.map((t) => ({
      queryKey: ["hours", t.id],
      queryFn: () => api.get<SingleResponse<HoursData>>(`/hours/teacher/${t.id}`),
      enabled: teachers.length > 0,
    })),
  });

  const chartData = teachers.map((t, i) => {
    const h = hoursQueries[i]?.data?.data;
    return {
      name: `${t.prenom[0]}. ${t.nom}`,
      heures: h?.total ?? 0,
      complementaires: h?.complementaires ?? 0,
    };
  });

  const handleDownload = async (type: "global" | "payment") => {
    try {
      const path = type === "global" ? "/reports/global-hours" : "/reports/payment";
      const filename = type === "global" ? "rapport-heures.xlsx" : "rapport-paiements.xlsx";
      await downloadFile(path, filename);
      toast.success("Téléchargement démarré");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du téléchargement");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rapports</h1>
          <p className="text-muted-foreground text-sm mt-1">États récapitulatifs et exports</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="gap-2" onClick={() => handleDownload("global")}>
            <Download className="h-4 w-4" /> Heures (Excel)
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleDownload("payment")}>
            <FileText className="h-4 w-4" /> Paiements (Excel)
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Imprimer
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement...</div>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Heures par enseignant</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="heures" fill="hsl(230,80%,56%)" name="Heures totales" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="complementaires" fill="hsl(38,92%,50%)" name="Complémentaires" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">État global des heures</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enseignant</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Département</TableHead>
                      <TableHead className="text-right">Heures totales</TableHead>
                      <TableHead className="text-right">H. normales</TableHead>
                      <TableHead className="text-right">H. complémentaires</TableHead>
                      <TableHead className="text-right">Taux</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map((t) => <TeacherRow key={t.id} teacher={t} />)}
                    {teachers.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun enseignant</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Statut des enseignants</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {teachers.map((t, i) => {
                  const comp = hoursQueries[i]?.data?.data?.complementaires ?? 0;
                  return (
                    <Badge key={t.id} variant={comp > 0 ? "destructive" : "default"}>
                      {t.prenom} {t.nom} {comp > 0 ? `(+${comp}h)` : ""}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
