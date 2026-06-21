import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton, StatCardSkeleton, TableRowsSkeleton } from "@/components/ui/skeleton-blocks";
import {
  ArrowLeft, Loader2, Mail, Phone, GraduationCap, Building2, Clock, FileDown, Eye,
  CalendarDays, Pencil, KeyRound, EyeOff, User, BarChart3, List,
} from "lucide-react";
import { toast } from "sonner";
import { fetchBlob, downloadFile, resetUserPassword } from "@/lib/api";
import { useTeacherById, useUpdateTeacher, useDeleteTeacher, TeacherFormData } from "@/hooks/useTeachers";
import { useTeacherHours } from "@/hooks/useHours";
import { useActivities } from "@/hooks/useActivities";
import { useAuth } from "@/contexts/AuthContext";

const departements = ["Informatique", "Mathématiques", "Physique", "Électronique", "Chimie", "Biologie", "Économie", "Droit", "Langues"];

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
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "secretaire";
  const canResetPassword = user?.role === "admin";

  const { data: teacherData, isLoading: tLoading, isError: tError } = useTeacherById(id);
  const { data: hoursData, isLoading: hLoading } = useTeacherHours(id);
  const { data: activitiesData, isLoading: aLoading } = useActivities({ enseignant_id: id });
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();

  const teacher = teacherData?.data;
  const hours = hoursData?.data;
  const activities = activitiesData?.data ?? [];

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [form, setForm] = useState<TeacherFormData | null>(null);
  const [activeTab, setActiveTab] = useState("informations");

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (teacher && editOpen) {
      setForm({
        nom: teacher.nom,
        prenom: teacher.prenom,
        grade: teacher.grade,
        statut: teacher.statut,
        departement: teacher.departement,
        email: teacher.email,
        telephone: teacher.telephone ?? "",
      });
    }
  }, [teacher, editOpen]);

  const handlePreview = async () => {
    if (!id || !teacher) return;
    setLoadingPreview(true);
    try {
      setPreviewUrl(await fetchBlob(`/reports/teacher/${id}`));
    } catch {
      toast.error("Impossible de charger le PDF.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async () => {
    if (!id || !teacher) return;
    setLoadingDownload(true);
    try {
      await downloadFile(`/reports/teacher/${id}`, `fiche_${teacher.nom}_${teacher.prenom}.pdf`);
    } catch {
      toast.error("Erreur lors du téléchargement.");
    } finally {
      setLoadingDownload(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!id || !form) return;
    if (!form.nom || !form.prenom || !form.email || !form.departement) {
      toast.error("Champs obligatoires manquants");
      return;
    }
    try {
      await updateTeacher.mutateAsync({ id, data: form });
      toast.success("Fiche mise à jour — taux horaire recalculé depuis Paramètres");
      setEditOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteTeacher.mutateAsync(id);
      toast.success("Enseignant supprimé");
      navigate("/enseignants");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleResetPassword = async () => {
    if (!teacher?.linkedUser?.id) return;
    if (newPassword.length < 6) {
      toast.error("Minimum 6 caractères");
      return;
    }
    setResetting(true);
    try {
      await resetUserPassword(teacher.linkedUser.id, newPassword);
      toast.success("Mot de passe réinitialisé");
      setResetOpen(false);
      setNewPassword("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setResetting(false);
    }
  };

  const displayName = teacher
    ? `${teacher.prenom} ${teacher.nom}`
    : null;

  return (
    <div className="space-y-6">
      {/* En-tête — toujours visible */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/enseignants")} className="gap-2 self-start shrink-0">
          <ArrowLeft className="h-4 w-4" /> Retour à la liste
        </Button>
        <div className="flex-1 min-w-0">
          {tLoading && !teacher ? (
            <>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-40" />
            </>
          ) : tError || (!tLoading && !teacher) ? (
            <p className="text-destructive text-sm">Enseignant introuvable.</p>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground truncate">{displayName}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {teacher!.grade} — {teacher!.departement}
              </p>
            </>
          )}
        </div>
        {teacher && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Badge variant={teacher.statut === "Permanent" ? "default" : "secondary"}>{teacher.statut}</Badge>
            <Button variant="outline" size="sm" className="gap-2" onClick={handlePreview} disabled={loadingPreview}>
              {loadingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Aperçu PDF
            </Button>
            <Button size="sm" className="gap-2" onClick={handleDownload} disabled={loadingDownload}>
              {loadingDownload ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Télécharger
            </Button>
            {canManage && (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" /> Modifier
              </Button>
            )}
          </div>
        )}
      </div>

      {(teacher || tLoading) && !tError && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-muted/50 p-1">
            <TabsTrigger value="informations" className="gap-1.5">
              <User className="h-3.5 w-3.5" /> Informations
            </TabsTrigger>
            <TabsTrigger value="heures" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" /> Heures & paiement
            </TabsTrigger>
            <TabsTrigger value="activites" className="gap-1.5">
              <List className="h-3.5 w-3.5" /> Activités
            </TabsTrigger>
            {canResetPassword && (
              <TabsTrigger value="compte" className="gap-1.5">
                <KeyRound className="h-3.5 w-3.5" /> Compte
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Informations ── */}
          <TabsContent value="informations" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> Coordonnées & profil
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tLoading && !teacher ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-5 w-full max-w-xs" />
                    ))}
                  </div>
                ) : teacher && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" /><span>{teacher.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" /><span>{teacher.telephone ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4 shrink-0" /><span>{teacher.departement}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>
                        Grade : <strong className="text-foreground">{teacher.grade}</strong>
                        {" · "}
                        Statut : <strong className="text-foreground">{teacher.statut}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Taux horaire appliqué</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                {tLoading && !teacher ? (
                  <>
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-4 w-full max-w-md" />
                  </>
                ) : teacher && (
                  <>
                    <p className="text-2xl font-bold">{teacher.taux_horaire.toLocaleString("fr-FR")} F CFA / h</p>
                    <p className="text-muted-foreground">
                      Ce montant provient de la grille <strong>Paramètres → Taux horaires</strong>, ligne{" "}
                      <em>{teacher.grade}</em> + colonne <em>{teacher.statut}</em>.
                      Il est recopié sur la fiche enseignant à chaque création, modification (grade/statut)
                      ou enregistrement des paramètres globaux.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Clé technique :{" "}
                      <code className="bg-muted px-1 rounded">
                        hourly_rate_{teacher.grade === "Assistant" ? "assistant" : teacher.grade === "Maître-Assistant" ? "maitre" : "professor"}_{teacher.statut === "Permanent" ? "permanent" : "vacataire"}
                      </code>
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Heures ── */}
          <TabsContent value="heures" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Bilan sur les activités validées uniquement</p>
              {hours?.academicYear ? (
                <Badge variant="outline" className="gap-1 text-xs">
                  <CalendarDays className="h-3 w-3" />{hours.academicYear.year_label}
                </Badge>
              ) : hLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : null}
            </div>
            {hLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
              </div>
            ) : hours && teacher ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Heures totales" value={Number(hours.total).toFixed(1)} sub="validées" />
                <StatCard label="Heures normales" value={Number(hours.normales).toFixed(1)} sub={`quota : ${hours.quota} h`} />
                <StatCard label="Heures complémentaires" value={Number(hours.complementaires).toFixed(1)} sub="au-delà du quota" />
                <StatCard
                  label="Montant complémentaire"
                  value={`${(Number(hours.complementaires) * teacher.taux_horaire).toLocaleString("fr-FR")} F CFA`}
                  sub={`${Number(hours.complementaires).toFixed(1)} h × ${teacher.taux_horaire.toLocaleString("fr-FR")} F CFA`}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">Aucune heure validée pour le moment.</p>
            )}
          </TabsContent>

          {/* ── Activités ── */}
          <TabsContent value="activites" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Historique des activités</CardTitle>
              </CardHeader>
              <CardContent>
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
                      {aLoading ? (
                        <TableRowsSkeleton rows={5} cols={6} />
                      ) : activities.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Aucune activité enregistrée
                          </TableCell>
                        </TableRow>
                      ) : (
                        activities.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{a.resource?.titre ?? "—"}</TableCell>
                            <TableCell>{a.type}</TableCell>
                            <TableCell>{a.complexite}</TableCell>
                            <TableCell>{new Date(a.date).toLocaleDateString("fr-FR")}</TableCell>
                            <TableCell className="text-right">{Number(a.heures_calculees).toFixed(1)}</TableCell>
                            <TableCell>
                              <Badge variant={a.statut === "Validée" ? "default" : a.statut === "Rejetée" ? "destructive" : "secondary"}>
                                {a.statut}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Compte ── */}
          {canResetPassword && (
            <TabsContent value="compte" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <KeyRound className="h-4 w-4" /> Compte de connexion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tLoading && !teacher ? (
                    <Skeleton className="h-16 w-full max-w-md" />
                  ) : teacher?.linkedUser ? (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="text-sm">
                        <p>Email : <strong>{teacher.linkedUser.email}</strong></p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Statut : {teacher.linkedUser.is_active ? "actif" : "inactif"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
                        Réinitialiser le mot de passe
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucun compte activé. Créez-en un depuis Paramètres → Gestion des comptes.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Supprimer — bas de page, lien texte */}
      {canManage && teacher && (
        <div className="pt-4 border-t flex justify-center">
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="text-sm text-destructive hover:underline disabled:opacity-50"
            disabled={deleteTeacher.isPending}
          >
            {deleteTeacher.isPending ? "Suppression…" : "Supprimer cet enseignant"}
          </button>
        </div>
      )}

      <Dialog open={!!previewUrl} onOpenChange={(open) => { if (!open) setPreviewUrl(null); }}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle>Fiche — {displayName ?? "…"}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe src={previewUrl} className="flex-1 w-full rounded-b-lg" title="Aperçu fiche enseignant" />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Modifier l'enseignant</DialogTitle></DialogHeader>
          {form && (
            <>
              <p className="text-sm text-muted-foreground -mt-2">
                Le taux horaire sera recalculé depuis Paramètres si le grade ou le statut change.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nom *</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
                <div className="space-y-2"><Label>Prénom *</Label><Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Téléphone</Label><Input value={form.telephone ?? ""} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
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
                <div className="space-y-2 col-span-2">
                  <Label>Département *</Label>
                  <Select value={form.departement} onValueChange={(v) => setForm({ ...form, departement: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {departements.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
                <Button onClick={handleSaveEdit} disabled={updateTeacher.isPending}>
                  {updateTeacher.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Enregistrer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {displayName} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Des activités ou cours liés peuvent empêcher la suppression.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Réinitialiser le mot de passe</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Compte : {teacher?.linkedUser?.email}</p>
          <div className="space-y-2">
            <Label>Nouveau mot de passe (min. 6 caractères)</Label>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setResetOpen(false)}>Annuler</Button>
            <Button onClick={handleResetPassword} disabled={resetting}>
              {resetting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
