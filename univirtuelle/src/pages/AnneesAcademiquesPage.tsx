import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useAcademicYears, useCreateAcademicYear, useUpdateAcademicYear, useDeleteAcademicYear,
  AcademicYear, AcademicYearFormData,
} from "@/hooks/useAcademicYears";

const emptyForm = (): AcademicYearFormData => ({
  year_label: "",
  start_date: "",
  end_date: "",
  is_active: false,
});

export default function AnneesAcademiquesPage() {
  const { data, isLoading, isError } = useAcademicYears();
  const createYear = useCreateAcademicYear();
  const updateYear = useUpdateAcademicYear();
  const deleteYear = useDeleteAcademicYear();

  const years = data?.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const [form, setForm] = useState<AcademicYearFormData>(emptyForm());

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setDialogOpen(true); };
  const openEdit = (y: AcademicYear) => {
    setEditing(y);
    setForm({ year_label: y.year_label, start_date: y.start_date, end_date: y.end_date, is_active: y.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.year_label || !form.start_date || !form.end_date) {
      toast.error("Tous les champs sont requis");
      return;
    }
    if (!/^\d{4}-\d{4}$/.test(form.year_label)) {
      toast.error("Le format de l'année doit être AAAA-AAAA (ex: 2024-2025)");
      return;
    }
    try {
      if (editing) {
        await updateYear.mutateAsync({ id: editing.id, data: form });
        toast.success("Année académique modifiée");
      } else {
        await createYear.mutateAsync(form);
        toast.success("Année académique créée");
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleActivate = async (y: AcademicYear) => {
    try {
      await updateYear.mutateAsync({ id: y.id, data: { is_active: true } });
      toast.success(`Année ${y.year_label} activée`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDelete = async (y: AcademicYear) => {
    if (y.is_active) { toast.error("Impossible de supprimer l'année active"); return; }
    try {
      await deleteYear.mutateAsync(y.id);
      toast.success("Année supprimée");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const isSaving = createYear.isPending || updateYear.isPending;
  const activeYear = years.find((y) => y.is_active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Années académiques</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeYear
              ? `Année en cours : ${activeYear.year_label}`
              : "Aucune année active"}
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Nouvelle année
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Chargement...
            </div>
          )}
          {isError && (
            <p className="text-sm text-destructive text-center py-8">
              Impossible de charger les années académiques.
            </p>
          )}
          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Année</TableHead>
                    <TableHead>Début</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {years.map((y) => (
                    <TableRow key={y.id}>
                      <TableCell className="font-medium">{y.year_label}</TableCell>
                      <TableCell>{new Date(y.start_date).toLocaleDateString("fr-DZ")}</TableCell>
                      <TableCell>{new Date(y.end_date).toLocaleDateString("fr-DZ")}</TableCell>
                      <TableCell>
                        {y.is_active
                          ? <Badge className="gap-1"><CheckCircle className="h-3 w-3" /> Active</Badge>
                          : <Badge variant="secondary">Inactive</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!y.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1"
                              onClick={() => handleActivate(y)}
                              disabled={updateYear.isPending}
                            >
                              <CheckCircle className="h-3 w-3" /> Activer
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(y)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(y)}
                            disabled={y.is_active || deleteYear.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {years.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Aucune année académique enregistrée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'année" : "Nouvelle année académique"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Libellé <span className="text-muted-foreground text-xs">(ex: 2024-2025)</span></Label>
              <Input
                value={form.year_label}
                onChange={(e) => setForm({ ...form, year_label: e.target.value })}
                placeholder="2024-2025"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active ?? false}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 rounded border"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Définir comme année active
                <span className="block text-xs text-muted-foreground font-normal">Désactivera automatiquement l'année courante</span>
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editing ? "Modifier" : "Créer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
