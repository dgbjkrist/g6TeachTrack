import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse, useAssignTeacher, useRemoveTeacher, useCarryOverAttributions, CourseFormData } from "@/hooks/useCourses";
import { useTeachers } from "@/hooks/useTeachers";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { BackendCourse } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Eye, UserPlus, Loader2, CalendarDays, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const emptyForm: CourseFormData = {
  intitule: "", filiere: "", niveau: "L1", semestre: 1, nombre_heures: 0, credits: 0,
};

export default function CoursPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BackendCourse | null>(null);
  const [form, setForm] = useState<CourseFormData>(emptyForm);

  const [attribDialogOpen, setAttribDialogOpen] = useState(false);
  const [attribCours, setAttribCours] = useState<BackendCourse | null>(null);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  const { data: yearsData } = useAcademicYears();
  const years = yearsData?.data ?? [];
  const activeYear = years.find((y) => y.is_active);
  const [selectedYearId, setSelectedYearId] = useState<string>("all");
  const defaultYearSet = useRef(false);
  useEffect(() => {
    if (!defaultYearSet.current && activeYear) {
      setSelectedYearId(activeYear.id);
      defaultYearSet.current = true;
    }
  }, [activeYear]);

  const { data: coursesData, isLoading, isError } = useCourses({
    academic_year_id: selectedYearId !== "all" ? selectedYearId : undefined,
  });
  const { data: teachersData } = useTeachers();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const assignTeacher = useAssignTeacher();
  const removeTeacher = useRemoveTeacher();
  const carryOver = useCarryOverAttributions();

  const allCourses = coursesData?.data ?? [];
  const allTeachers = teachersData?.data ?? [];

  const filtered = allCourses.filter((c) =>
    c.intitule.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: BackendCourse) => {
    setEditing(c);
    setForm({
      intitule: c.intitule, filiere: c.filiere, niveau: c.niveau,
      semestre: c.semestre, nombre_heures: c.nombre_heures, credits: c.credits,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.intitule || !form.filiere) {
      toast.error("Champs obligatoires manquants");
      return;
    }
    try {
      if (editing) {
        await updateCourse.mutateAsync({ id: editing.id, data: form });
        toast.success("Cours modifié");
      } else {
        await createCourse.mutateAsync(form);
        toast.success("Cours ajouté");
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCourse.mutateAsync(id);
      toast.success("Cours supprimé");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  const openAttrib = (c: BackendCourse) => {
    setAttribCours(c);
    setSelectedTeacherIds(c.teachers.map((t) => t.id));
    setAttribDialogOpen(true);
  };

  const saveAttrib = async () => {
    if (!attribCours) return;
    const currentIds = attribCours.teachers.map((t) => t.id);
    const toAdd = selectedTeacherIds.filter((id) => !currentIds.includes(id));
    const toRemove = currentIds.filter((id) => !selectedTeacherIds.includes(id));
    try {
      await Promise.all([
        ...toAdd.map((tid) => assignTeacher.mutateAsync({ courseId: attribCours.id, teacherId: tid })),
        ...toRemove.map((tid) => removeTeacher.mutateAsync({ courseId: attribCours.id, teacherId: tid })),
      ]);
      toast.success(`Attribution mise à jour`);
      setAttribDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'attribution");
    }
  };

  const toggleTeacher = (id: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCarryOver = async () => {
    try {
      const result = await carryOver.mutateAsync();
      toast.success(result.message ?? "Attributions reconduites");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la reconduction");
    }
  };

  const isSaving = createCourse.isPending || updateCourse.isPending;
  const isAttribSaving = assignTeacher.isPending || removeTeacher.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cours</h1>
          <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {selectedYearId !== "all"
              ? <>{allCourses.length} cours — année <strong>{years.find((y) => y.id === selectedYearId)?.year_label}</strong></>
              : <>{allCourses.length} cours (catalogue complet)</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYearId} onValueChange={setSelectedYearId}>
            <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="Année" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les années</SelectItem>
              {years.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.year_label}{y.is_active ? " ★" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleCarryOver}
            disabled={carryOver.isPending}
            title="Copier toutes les attributions de l'année précédente vers l'année active"
          >
            {carryOver.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />}
            Reconduire N-1
          </Button>
          <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Ajouter</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un cours..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Chargement...
            </div>
          )}

          {isError && (
            <div className="py-8 text-center text-destructive text-sm">
              Impossible de charger les cours. Vérifiez que le serveur est démarré.
            </div>
          )}

          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Intitulé</TableHead>
                    <TableHead>Filière</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Semestre</TableHead>
                    <TableHead className="text-right">Heures</TableHead>
                    <TableHead className="text-right">Crédits</TableHead>
                    <TableHead>Enseignant(s)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.intitule}</TableCell>
                      <TableCell>{c.filiere}</TableCell>
                      <TableCell><Badge variant="secondary">{c.niveau}</Badge></TableCell>
                      <TableCell>S{c.semestre}</TableCell>
                      <TableCell className="text-right">{c.nombre_heures}h</TableCell>
                      <TableCell className="text-right">{c.credits}</TableCell>
                      <TableCell>
                        {c.teachers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {c.teachers.map((t) => (
                              <Badge key={t.id} variant="outline" className="text-xs">
                                {t.prenom} {t.nom}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            title={selectedYearId === "all" ? "Sélectionnez une année pour gérer les attributions" : "Attribuer enseignants"}
                            onClick={() => openAttrib(c)}
                            disabled={selectedYearId === "all"}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/cours/${c.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(c.id)}
                            disabled={deleteCourse.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Aucun cours trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le cours" : "Ajouter un cours"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Intitulé *</Label>
              <Input value={form.intitule} onChange={(e) => setForm({ ...form, intitule: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Filière *</Label>
              <Input value={form.filiere} onChange={(e) => setForm({ ...form, filiere: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Niveau</Label>
              <Select value={form.niveau} onValueChange={(v) => setForm({ ...form, niveau: v as CourseFormData["niveau"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["L1", "L2", "L3", "M1", "M2"].map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semestre</Label>
              <Select value={String(form.semestre)} onValueChange={(v) => setForm({ ...form, semestre: Number(v) as 1 | 2 })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semestre 1</SelectItem>
                  <SelectItem value="2">Semestre 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nombre d'heures</Label>
              <Input
                type="number"
                value={form.nombre_heures}
                onChange={(e) => setForm({ ...form, nombre_heures: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Crédits</Label>
              <Input
                type="number"
                value={form.credits}
                onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enregistrement...</> : (editing ? "Modifier" : "Ajouter")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attribution Dialog */}
      <Dialog open={attribDialogOpen} onOpenChange={setAttribDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Attribuer des enseignants</DialogTitle>
          </DialogHeader>
          {attribCours && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Cours : <span className="font-medium text-foreground">{attribCours.intitule}</span>
                </p>
                {activeYear ? (
                  <Badge variant="outline" className="gap-1 text-xs shrink-0">
                    <CalendarDays className="h-3 w-3" />
                    {activeYear.year_label}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1 text-xs shrink-0">
                    <AlertTriangle className="h-3 w-3" />
                    Aucune année active
                  </Badge>
                )}
              </div>
              {selectedYearId !== "all" && selectedYearId !== activeYear?.id && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-md px-3 py-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Vous consultez une année passée. Les modifications s'appliqueront à l'année active ({activeYear?.year_label ?? "—"}).
                </p>
              )}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allTeachers.map((t) => (
                  <label key={t.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={selectedTeacherIds.includes(t.id)}
                      onCheckedChange={() => toggleTeacher(t.id)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t.prenom} {t.nom}</p>
                      <p className="text-xs text-muted-foreground">{t.grade} • {t.departement}</p>
                    </div>
                  </label>
                ))}
                {allTeachers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun enseignant disponible</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{selectedTeacherIds.length} enseignant(s) sélectionné(s)</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAttribDialogOpen(false)}>Annuler</Button>
            <Button onClick={saveAttrib} disabled={isAttribSaving || !activeYear}>
              {isAttribSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enregistrement...</> : "Enregistrer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
