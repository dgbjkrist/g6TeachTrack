import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useActivities, useValidateActivity } from "@/hooks/useActivities";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, CheckCircle, XCircle, Loader2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

export default function ActivitesPage() {
  const { user } = useAuth();
  const { data: yearsData } = useAcademicYears();
  const years = yearsData?.data ?? [];
  const activeYear = years.find((y) => y.is_active);

  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const defaultYearSet = useRef(false);
  useEffect(() => {
    if (!defaultYearSet.current && activeYear) {
      setFilterYear(activeYear.id);
      defaultYearSet.current = true;
    }
  }, [activeYear]);

  const isEnseignant = user?.role === "enseignant";

  const { data, isLoading, isError } = useActivities({
    ...(isEnseignant ? { enseignant_id: user?.teacher_id ?? undefined } : {}),
    ...(filterYear !== "all" ? { academic_year_id: filterYear } : {}),
  });

  const validate = useValidateActivity();
  const activities = data?.data ?? [];

  const filtered = activities.filter((a) => {
    const resourceTitle = a.resource?.titre ?? "";
    const matchSearch =
      resourceTitle.toLowerCase().includes(search.toLowerCase()) ||
      `${a.teacher?.prenom ?? ""} ${a.teacher?.nom ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === "all" || a.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const handleValidate = async (id: string, statut: "Validée" | "Rejetée") => {
    try {
      await validate.mutateAsync({ id, statut });
      toast.success(`Activité ${statut.toLowerCase()}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const selectedYear = years.find((y) => y.id === filterYear);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activités pédagogiques</h1>
          <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {selectedYear
              ? <>Année <strong>{selectedYear.year_label}</strong> — {filtered.length} activité{filtered.length !== 1 ? "s" : ""}</>
              : <>{filtered.length} activité{filtered.length !== 1 ? "s" : ""} (toutes années)</>}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par ressource ou enseignant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Année" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les années</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.year_label}{y.is_active ? " ★" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
                <SelectItem value="Validée">Validée</SelectItem>
                <SelectItem value="Rejetée">Rejetée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Chargement...
            </div>
          )}
          {isError && (
            <div className="py-8 text-center text-destructive text-sm">
              Impossible de charger les activités.
            </div>
          )}
          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {!isEnseignant && <TableHead>Enseignant</TableHead>}
                    <TableHead>Type</TableHead>
                    <TableHead>Ressource</TableHead>
                    <TableHead>Complexité</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Heures</TableHead>
                    <TableHead>Statut</TableHead>
                    {!isEnseignant && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      {!isEnseignant && (
                        <TableCell className="text-sm">
                          {a.teacher ? `${a.teacher.prenom} ${a.teacher.nom}` : "—"}
                        </TableCell>
                      )}
                      <TableCell><Badge variant="secondary">{a.type}</Badge></TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {a.resource?.titre ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.complexite === "Élevé" ? "destructive" : a.complexite === "Moyen" ? "default" : "secondary"}>
                          {a.complexite}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.date}</TableCell>
                      <TableCell className="text-right font-medium">{a.heures_calculees}h</TableCell>
                      <TableCell>
                        <Badge variant={a.statut === "Validée" ? "default" : a.statut === "En attente" ? "secondary" : "destructive"}>
                          {a.statut}
                        </Badge>
                      </TableCell>
                      {!isEnseignant && (
                        <TableCell className="text-right">
                          {a.statut === "En attente" && (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8 text-emerald-600"
                                onClick={() => handleValidate(a.id, "Validée")}
                                disabled={validate.isPending}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                onClick={() => handleValidate(a.id, "Rejetée")}
                                disabled={validate.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isEnseignant ? 6 : 8} className="text-center text-muted-foreground py-8">
                        Aucune activité trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
