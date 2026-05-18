import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, Mail, Phone, GraduationCap, Building2, Clock, FileDown, Eye } from "lucide-react";
import { toast } from "sonner";
import { fetchBlob, downloadFile } from "@/lib/api";
import { useTeacherById } from "@/hooks/useTeachers";
import { useTeacherHours } from "@/hooks/useHours";
import { useActivities } from "@/hooks/useActivities";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function EnseignantFichePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: teacherData, isLoading: tLoading, isError: tError } = useTeacherById(id);
  const { data: hoursData, isLoading: hLoading } = useTeacherHours(id);
  const { data: activitiesData, isLoading: aLoading } = useActivities({ enseignant_id: id });

  const teacher = teacherData?.data;
  const hours = hoursData?.data;
  const activities = activitiesData?.data ?? [];

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);

  // Cleanup blob URL when dialog closes
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handlePreview = async () => {
    if (!id) return;
    setLoadingPreview(true);
    try {
      const url = await fetchBlob(`/reports/teacher/${id}`);
      setPreviewUrl(url);
    } catch {
      toast.error("Impossible de charger le PDF. Vérifiez que le serveur est démarré.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async () => {
    if (!id || !teacher) return;
    setLoadingDownload(true);
    try {
      await downloadFile(
        `/reports/teacher/${id}`,
        `fiche_${teacher.nom}_${teacher.prenom}.pdf`
      );
    } catch {
      toast.error("Erreur lors du téléchargement.");
    } finally {
      setLoadingDownload(false);
    }
  };

  if (tLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement...
      </div>
    );
  }

  if (tError || !teacher) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/enseignants")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <p className="text-destructive text-sm">Enseignant introuvable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/enseignants")} className="gap-2 self-start">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{teacher.prenom} {teacher.nom}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{teacher.grade} — {teacher.departement}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={teacher.statut === "Permanent" ? "default" : "secondary"}>
            {teacher.statut}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handlePreview}
            disabled={loadingPreview}
          >
            {loadingPreview
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Eye className="h-4 w-4" />}
            Aperçu PDF
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={handleDownload}
            disabled={loadingDownload}
          >
            {loadingDownload
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <FileDown className="h-4 w-4" />}
            Télécharger
          </Button>
        </div>
      </div>

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => { if (!open) setPreviewUrl(null); }}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle>
                Fiche — {teacher.prenom} {teacher.nom}
              </DialogTitle>
              <Button size="sm" className="gap-2" onClick={handleDownload} disabled={loadingDownload}>
                {loadingDownload
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <FileDown className="h-4 w-4" />}
                Télécharger
              </Button>
            </div>
          </DialogHeader>
          {previewUrl && (
            <iframe
              src={previewUrl}
              className="flex-1 w-full rounded-b-lg"
              title="Aperçu fiche enseignant"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Identity card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span>{teacher.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{teacher.telephone ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span>{teacher.departement}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Taux horaire : <strong className="text-foreground">{teacher.taux_horaire} DA</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hours summary */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Bilan des heures</h2>
        {hLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
          </div>
        ) : hours ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Heures totales" value={Number(hours.total).toFixed(1)} sub="heures" />
            <StatCard label="Heures normales" value={Number(hours.normales).toFixed(1)} sub={`quota : ${hours.quota}h`} />
            <StatCard label="Heures complémentaires" value={Number(hours.complementaires).toFixed(1)} sub="au-delà du quota" />
            <StatCard
              label="Montant estimé"
              value={`${(Number(hours.complementaires) * teacher.taux_horaire).toLocaleString("fr-DZ")} DA`}
              sub="heures complémentaires"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune donnée d'heures disponible.</p>
        )}
      </div>

      {/* Activities table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Activités pédagogiques</CardTitle>
        </CardHeader>
        <CardContent>
          {aLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ressource</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Complexité</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Heures</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.resource?.titre ?? "—"}</TableCell>
                      <TableCell>{a.type}</TableCell>
                      <TableCell>{a.complexite}</TableCell>
                      <TableCell>{new Date(a.date).toLocaleDateString("fr-DZ")}</TableCell>
                      <TableCell className="text-right">{Number(a.heures_calculees).toFixed(1)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.statut === "Validée" ? "default" :
                            a.statut === "Rejetée" ? "destructive" : "secondary"
                          }
                        >
                          {a.statut}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {activities.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucune activité enregistrée
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
