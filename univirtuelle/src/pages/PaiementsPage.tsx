import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, CheckCircle, Loader2, CreditCard, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { usePayments, useGeneratePayment, useUpdatePaymentStatus, useDeletePayment, useRecalculatePayment, usePaymentPreview, Payment } from "@/hooks/usePayments";
import { useTeachers } from "@/hooks/useTeachers";
import { useAcademicYears } from "@/hooks/useAcademicYears";

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  en_attente: "En attente",
  paye: "Payé",
  payé: "Payé",
  annulé: "Annulé",
};

const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "payé" || s === "paye") return "default";
  if (s === "annulé") return "destructive";
  return "secondary";
};

// ─── Update status dialog ─────────────────────────────────────────────────────

function UpdateStatusDialog({
  payment,
  onClose,
}: {
  payment: Payment | null;
  onClose: () => void;
}) {
  const [status, setStatus] = useState(payment?.status ?? "en_attente");
  const [date, setDate] = useState(payment?.payment_date ?? "");
  const [notes, setNotes] = useState(payment?.notes ?? "");
  const update = useUpdatePaymentStatus();

  if (!payment) return null;

  const handleSave = async () => {
    try {
      await update.mutateAsync({ id: payment.id, status, payment_date: date || undefined, notes: notes || undefined });
      toast.success("Statut mis à jour");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <Dialog open={!!payment} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mettre à jour le paiement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            {payment.teacher?.prenom} {payment.teacher?.nom} — {Number(payment.montant_total).toLocaleString("fr-DZ")} F CFA
          </p>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="payé">Payé</SelectItem>
                <SelectItem value="annulé">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(status === "payé" || status === "paye") && (
            <div className="space-y-2">
              <Label>Date de paiement</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Notes <span className="text-muted-foreground font-normal">(optionnel)</span></Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Generate payment dialog ──────────────────────────────────────────────────

function GenerateDialog({ onClose }: { onClose: () => void }) {
  const { data: teachersData } = useTeachers();
  const { data: yearsData } = useAcademicYears();
  const generate = useGeneratePayment();

  const teachers = teachersData?.data ?? [];
  const years = yearsData?.data ?? [];
  const activeYear = years.find((y) => y.is_active);

  const [teacherId, setTeacherId] = useState("");
  const [yearId, setYearId] = useState(activeYear?.id ?? "__none__");
  const preview = usePaymentPreview(teacherId, yearId);

  const handleGenerate = async () => {
    if (!teacherId) { toast.error("Sélectionnez un enseignant"); return; }
    try {
      await generate.mutateAsync({
        teacher_id: teacherId,
        academic_year_id: yearId === "__none__" ? null : yearId,
      });
      toast.success("Paiement généré");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Générer un paiement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Enseignant</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un enseignant" /></SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.prenom} {t.nom} — {t.grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Année académique</Label>
            <Select value={yearId} onValueChange={setYearId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner une année" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Aucune année spécifique</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.year_label}{y.is_active ? " (active)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeYear && yearId === activeYear.id && (
              <p className="text-xs text-muted-foreground">
                Année active sélectionnée automatiquement.
              </p>
            )}
          </div>
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <p>
              Montant = <strong>heures complémentaires × taux horaire</strong> (activités validées, année sélectionnée).
            </p>
            {teacherId && preview.data?.data && (
              <p className="text-foreground">
                Aperçu : {Number(preview.data.data.heuresComplementaires).toFixed(1)} h compl. ×{" "}
                {preview.data.data.taux_horaire.toLocaleString("fr-FR")} F CFA ={" "}
                <strong>{preview.data.data.montantTotal.toLocaleString("fr-FR")} F CFA</strong>
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleGenerate} disabled={generate.isPending}>
            {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Générer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PaiementsPage() {
  const { data: teachersData } = useTeachers();
  const { data: yearsData } = useAcademicYears();
  const deletePayment = useDeletePayment();
  const recalculate = useRecalculatePayment();

  const teachers = teachersData?.data ?? [];
  const years = yearsData?.data ?? [];
  const activeYear = years.find((y) => y.is_active);

  const [filterTeacher, setFilterTeacher] = useState("all");
  const [filterYear, setFilterYear] = useState(activeYear?.id ?? "all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);

  const { data, isLoading, isError } = usePayments({
    teacher_id: filterTeacher !== "all" ? filterTeacher : undefined,
    academic_year_id: filterYear !== "all" ? filterYear : undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });

  const payments = data?.data ?? [];

  const totalMontant = payments.reduce((s, p) => s + Number(p.montant_total), 0);
  const paidCount = payments.filter((p) => p.status === "payé" || p.status === "paye").length;

  const handleRecalculate = async (p: Payment) => {
    try {
      await recalculate.mutateAsync(p.id);
      toast.success("Montant recalculé à partir des heures actuelles");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDelete = async (p: Payment) => {
    try {
      await deletePayment.mutateAsync(p.id);
      toast.success("Paiement supprimé");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paiements</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeYear
              ? <>Année active : <strong>{activeYear.year_label}</strong> — montant = h. complémentaires × taux horaire</>
              : "Aucune année académique active"}
          </p>
        </div>
        <Button onClick={() => setGenerateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Générer un paiement
        </Button>
      </div>

      {/* Summary cards */}
      {!isLoading && payments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total paiements</p>
            <p className="text-2xl font-bold">{payments.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Montant total</p>
            <p className="text-2xl font-bold">{totalMontant.toLocaleString("fr-DZ")} F CFA</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Payés</p>
            <p className="text-2xl font-bold">{paidCount} / {payments.length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Année" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les années</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.year_label}{y.is_active ? " ★" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTeacher} onValueChange={setFilterTeacher}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Enseignant" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les enseignants</SelectItem>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.prenom} {t.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="payé">Payé</SelectItem>
                <SelectItem value="annulé">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Chargement...
            </div>
          )}
          {isError && (
            <p className="text-sm text-destructive text-center py-8">
              Impossible de charger les paiements.
            </p>
          )}
          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enseignant</TableHead>
                    <TableHead>Année</TableHead>
                    <TableHead className="text-right">H. totales</TableHead>
                    <TableHead className="text-right">H. complémentaires</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date paiement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.teacher?.prenom} {p.teacher?.nom}
                      </TableCell>
                      <TableCell>
                        {p.academicYear?.year_label ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">{Number(p.total_heures).toFixed(1)}h</TableCell>
                      <TableCell className="text-right">{Number(p.heures_complementaires).toFixed(1)}h</TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(p.montant_total).toLocaleString("fr-DZ")} F CFA
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(p.status)}>
                          {p.status === "payé" || p.status === "paye"
                            ? <><CheckCircle className="h-3 w-3 mr-1" />Payé</>
                            : STATUS_LABELS[p.status] ?? p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.payment_date
                          ? new Date(p.payment_date).toLocaleDateString("fr-DZ")
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === "en_attente" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Recalculer le montant"
                              onClick={() => handleRecalculate(p)}
                              disabled={recalculate.isPending}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Modifier le statut"
                            onClick={() => setEditPayment(p)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(p)}
                            disabled={deletePayment.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        Aucun paiement trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {generateOpen && <GenerateDialog onClose={() => setGenerateOpen(false)} />}
      <UpdateStatusDialog payment={editPayment} onClose={() => setEditPayment(null)} />
    </div>
  );
}
