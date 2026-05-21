import { useState } from "react";
const departements = ["Informatique", "Mathématiques", "Physique", "Électronique", "Chimie", "Biologie", "Économie", "Droit", "Langues"];

import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher, TeacherFormData } from "@/hooks/useTeachers";
import { BackendTeacher } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const emptyForm: TeacherFormData = {
  nom: "", prenom: "", grade: "Assistant", statut: "Permanent",
  departement: "", taux_horaire: 2000, email: "", telephone: "",
};

export default function EnseignantsPage() {
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BackendTeacher | null>(null);
  const [form, setForm] = useState<TeacherFormData>(emptyForm);
  const navigate = useNavigate();

  const { data, isLoading, isError } = useTeachers({ search, departement: filterDept, grade: filterGrade });
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();

  const teachers = data?.data ?? [];

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: BackendTeacher) => {
    setEditing(t);
    setForm({
      nom: t.nom, prenom: t.prenom, grade: t.grade, statut: t.statut,
      departement: t.departement, taux_horaire: t.taux_horaire,
      email: t.email, telephone: t.telephone ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nom || !form.prenom || !form.email || !form.departement) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    try {
      if (editing) {
        await updateTeacher.mutateAsync({ id: editing.id, data: form });
        toast.success("Enseignant modifié");
      } else {
        await createTeacher.mutateAsync(form);
        toast.success("Enseignant ajouté");
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTeacher.mutateAsync(id);
      toast.success("Enseignant supprimé");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  const isSaving = createTeacher.isPending || updateTeacher.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Enseignants</h1>
          <p className="text-muted-foreground text-sm mt-1">{teachers.length} enseignants enregistrés</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Département" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les départements</SelectItem>
                {departements.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Grade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les grades</SelectItem>
                <SelectItem value="Assistant">Assistant</SelectItem>
                <SelectItem value="Maître-Assistant">Maître-Assistant</SelectItem>
                <SelectItem value="Professeur">Professeur</SelectItem>
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
              Impossible de charger les enseignants. Vérifiez que le serveur est démarré.
            </div>
          )}

          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Taux horaire</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{t.prenom} {t.nom}</p>
                          <p className="text-xs text-muted-foreground">{t.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{t.grade}</TableCell>
                      <TableCell>{t.departement}</TableCell>
                      <TableCell>
                        <Badge variant={t.statut === "Permanent" ? "default" : "secondary"}>{t.statut}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{t.taux_horaire} DA</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/enseignants/${t.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(t.id)}
                            disabled={deleteTeacher.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {teachers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun enseignant trouvé
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
            <DialogTitle>{editing ? "Modifier l'enseignant" : "Ajouter un enseignant"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Prénom *</Label>
              <Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.telephone ?? ""} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Grade</Label>
              <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v as TeacherFormData["grade"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Assistant">Assistant</SelectItem>
                  <SelectItem value="Maître-Assistant">Maître-Assistant</SelectItem>
                  <SelectItem value="Professeur">Professeur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v as TeacherFormData["statut"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Permanent">Permanent</SelectItem>
                  <SelectItem value="Vacataire">Vacataire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Département *</Label>
              <Select value={form.departement} onValueChange={(v) => setForm({ ...form, departement: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {departements.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Taux horaire (DA)</Label>
              <Input
                type="number"
                value={form.taux_horaire}
                onChange={(e) => setForm({ ...form, taux_horaire: Number(e.target.value) })}
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

    </div>
  );
}
