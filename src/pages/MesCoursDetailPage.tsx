import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { useSequences, useCreateSequence, useUpdateSequence, useDeleteSequence } from "@/hooks/useSequences";
import { useResources, useCreateResource, useUpdateResource, useDeleteResource, ResourceFormData } from "@/hooks/useResources";
import { useActivities } from "@/hooks/useActivities";
import { BackendSequence, BackendResource } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, ArrowUp, ArrowDown, BookOpen, FileText, Video, ClipboardCheck, Zap, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { ResourceContentDialog, ResourceIndicators, resourceTypeIcon } from "@/components/ResourceContentDialog";

const RESSOURCE_TYPES = ["Texte", "Vidéo", "Document", "Quiz", "Activité interactive", "Évaluation"] as const;

const emptyResForm = (): Omit<ResourceFormData, "course_id"> => ({
  titre: "", type: "Texte", description: "", complexite: "Moyen",
  contenu_texte: "", video_url: "", document_url: "", evaluation_url: "",
  quiz: [], sequence_id: null,
});

export default function MesCoursDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: coursesData, isLoading: loadingCourse } = useCourses();
  const { data: seqData, isLoading: loadingSeq } = useSequences(id);
  const { data: resData, isLoading: loadingRes } = useResources(id);
  const { data: activitiesData } = useActivities(
    user?.teacher_id ? { enseignant_id: user.teacher_id } : undefined
  );

  const createSeq = useCreateSequence();
  const updateSeq = useUpdateSequence(id!);
  const deleteSeq = useDeleteSequence(id!);
  const createRes = useCreateResource();
  const updateRes = useUpdateResource(id!);
  const deleteRes = useDeleteResource(id!);

  const course = coursesData?.data.find(
    (c) => c.id === id && c.teachers.some((t) => t.id === user?.teacher_id)
  );
  const sequences = [...(seqData?.data ?? [])].sort((a, b) => a.ordre - b.ordre);
  const resources = resData?.data ?? [];
  const activities = activitiesData?.data ?? [];

  // Sequence dialog
  const [seqDialogOpen, setSeqDialogOpen] = useState(false);
  const [editingSeq, setEditingSeq] = useState<BackendSequence | null>(null);
  const [seqTitle, setSeqTitle] = useState("");

  // Resource dialog
  const [resDialogOpen, setResDialogOpen] = useState(false);
  const [editingRes, setEditingRes] = useState<BackendResource | null>(null);
  const [resForm, setResForm] = useState<Omit<ResourceFormData, "course_id">>(emptyResForm());
  const [viewResource, setViewResource] = useState<BackendResource | null>(null);

  if (loadingCourse) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Cours introuvable ou non attribué</p>
        <Button variant="outline" onClick={() => navigate("/mes-cours")}>Retour</Button>
      </div>
    );
  }

  // ─── Sequences ───────────────────────────────────────────────────────────────

  const openAddSeq = () => { setEditingSeq(null); setSeqTitle(""); setSeqDialogOpen(true); };
  const openEditSeq = (s: BackendSequence) => { setEditingSeq(s); setSeqTitle(s.titre); setSeqDialogOpen(true); };

  const saveSeq = async () => {
    if (!seqTitle.trim()) { toast.error("Titre obligatoire"); return; }
    try {
      if (editingSeq) {
        await updateSeq.mutateAsync({ id: editingSeq.id, data: { titre: seqTitle } });
        toast.success("Séquence modifiée");
      } else {
        const maxOrdre = sequences.reduce((m, s) => Math.max(m, s.ordre), 0);
        await createSeq.mutateAsync({ course_id: id!, titre: seqTitle, ordre: maxOrdre + 1 });
        toast.success("Séquence ajoutée");
      }
      setSeqDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDeleteSeq = async (seqId: string) => {
    try {
      await deleteSeq.mutateAsync(seqId);
      toast.success("Séquence supprimée");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const moveSeq = async (seq: BackendSequence, dir: -1 | 1) => {
    const idx = sequences.findIndex((s) => s.id === seq.id);
    const target = sequences[idx + dir];
    if (!target) return;
    try {
      await Promise.all([
        updateSeq.mutateAsync({ id: seq.id, data: { ordre: target.ordre } }),
        updateSeq.mutateAsync({ id: target.id, data: { ordre: seq.ordre } }),
      ]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  // ─── Resources ───────────────────────────────────────────────────────────────

  const openAddRes = (seqId: string) => {
    setEditingRes(null);
    setResForm({ ...emptyResForm(), sequence_id: seqId });
    setResDialogOpen(true);
  };

  const openEditRes = (r: BackendResource) => {
    setEditingRes(r);
    setResForm({
      titre: r.titre, type: r.type, description: r.description ?? "",
      complexite: r.complexite, contenu_texte: r.contenu_texte ?? "",
      video_url: r.video_url ?? "", document_url: r.document_url ?? "",
      evaluation_url: r.evaluation_url ?? "", quiz: r.quiz ?? [],
      sequence_id: r.sequence_id,
    });
    setResDialogOpen(true);
  };

  const saveRes = async () => {
    if (!resForm.titre.trim()) { toast.error("Titre obligatoire"); return; }
    try {
      if (editingRes) {
        await updateRes.mutateAsync({ id: editingRes.id, data: { ...resForm, course_id: id! } });
        toast.success("Ressource modifiée — activité auto-créée");
      } else {
        await createRes.mutateAsync({ ...resForm, course_id: id! });
        toast.success("Ressource ajoutée — activité auto-créée");
      }
      setResDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDeleteRes = async (resId: string) => {
    try {
      await deleteRes.mutateAsync(resId);
      toast.success("Ressource supprimée");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const courseResIds = resources.map((r) => r.id);
  const courseActivities = activities
    .filter((a) => courseResIds.includes(a.resource_id))
    .slice(0, 5);

  const unassigned = resources.filter((r) => !r.sequence_id);
  const isSavingSeq = createSeq.isPending || updateSeq.isPending;
  const isSavingRes = createRes.isPending || updateRes.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/mes-cours")} className="mt-1">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{course.intitule}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="secondary">{course.niveau}</Badge>
            <Badge variant="outline">S{course.semestre}</Badge>
            <span className="text-sm text-muted-foreground">{course.filiere}</span>
            <span className="text-sm text-muted-foreground">• {course.nombre_heures}h • {course.credits} crédits</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-primary">{sequences.length}</p><p className="text-xs text-muted-foreground">Séquences</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-primary">{resources.length}</p><p className="text-xs text-muted-foreground">Ressources</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-primary">{course.nombre_heures}h</p><p className="text-xs text-muted-foreground">Volume horaire</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-primary">{courseActivities.length}</p><p className="text-xs text-muted-foreground">Activités récentes</p></CardContent></Card>
      </div>

      {courseActivities.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Activités pédagogiques récentes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {courseActivities.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50 text-sm">
                  <Badge variant={a.type === "Création" ? "default" : "secondary"} className="text-xs shrink-0">{a.type}</Badge>
                  <span className="flex-1 truncate">{a.resource?.titre ?? a.resource_id}</span>
                  <Badge variant={a.statut === "Validée" ? "default" : a.statut === "Rejetée" ? "destructive" : "secondary"} className="text-xs">{a.statut}</Badge>
                  <span className="text-muted-foreground text-xs">{a.heures_calculees}h</span>
                  <span className="text-muted-foreground text-xs">{a.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="h-5 w-5" /> Séquences pédagogiques
        </h2>
        <Button onClick={openAddSeq} size="sm" className="gap-1"><Plus className="h-4 w-4" /> Séquence</Button>
      </div>

      {loadingSeq || loadingRes ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement du contenu...</div>
      ) : sequences.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Aucune séquence. Ajoutez-en une pour structurer ce cours.</CardContent></Card>
      ) : (
        sequences.map((seq, seqIdx) => {
          const seqRes = resources.filter((r) => r.sequence_id === seq.id);
          return (
            <Card key={seq.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">#{seq.ordre}</Badge>
                    {seq.titre}
                    <Badge variant="outline" className="text-xs">{seqRes.length} ressource{seqRes.length !== 1 ? "s" : ""}</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSeq(seq, -1)} disabled={seqIdx === 0}><ArrowUp className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSeq(seq, 1)} disabled={seqIdx === sequences.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSeq(seq)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteSeq(seq.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {seqRes.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {seqRes.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50 group">
                        <span className="text-muted-foreground shrink-0">{resourceTypeIcon[r.type]}</span>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm font-medium truncate">{r.titre}</p>
                          {r.description && <p className="text-xs text-muted-foreground truncate">{r.description}</p>}
                          <ResourceIndicators resource={r} />
                        </div>
                        <Badge variant={r.complexite === "Élevé" ? "destructive" : r.complexite === "Moyen" ? "default" : "secondary"} className="text-xs shrink-0">{r.complexite}</Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewResource(r)}><Eye className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditRes(r)}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteRes(r.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="outline" size="sm" className="gap-1" onClick={() => openAddRes(seq.id)}>
                  <Plus className="h-3 w-3" /> Ajouter une ressource
                </Button>
              </CardContent>
            </Card>
          );
        })
      )}

      {unassigned.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-foreground">Ressources non assignées</h2>
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {unassigned.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50 group">
                    <span className="text-muted-foreground shrink-0">{resourceTypeIcon[r.type]}</span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium truncate">{r.titre}</p>
                      {r.description && <p className="text-xs text-muted-foreground truncate">{r.description}</p>}
                      <ResourceIndicators resource={r} />
                    </div>
                    <Badge variant={r.complexite === "Élevé" ? "destructive" : r.complexite === "Moyen" ? "default" : "secondary"} className="text-xs shrink-0">{r.complexite}</Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewResource(r)}><Eye className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditRes(r)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteRes(r.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <ResourceContentDialog resource={viewResource} onClose={() => setViewResource(null)} />

      {/* Sequence Dialog */}
      <Dialog open={seqDialogOpen} onOpenChange={setSeqDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingSeq ? "Modifier la séquence" : "Ajouter une séquence"}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input value={seqTitle} onChange={(e) => setSeqTitle(e.target.value)} placeholder="Ex: Introduction aux structures de données" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSeqDialogOpen(false)}>Annuler</Button>
            <Button onClick={saveSeq} disabled={isSavingSeq}>
              {isSavingSeq ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingSeq ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resource Dialog */}
      <Dialog open={resDialogOpen} onOpenChange={setResDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRes ? "Modifier la ressource" : "Ajouter une ressource"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input value={resForm.titre} onChange={(e) => setResForm({ ...resForm, titre: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Type principal</Label>
                <Select value={resForm.type} onValueChange={(v) => setResForm({ ...resForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RESSOURCE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Complexité</Label>
                <Select value={resForm.complexite} onValueChange={(v) => setResForm({ ...resForm, complexite: v as ResourceFormData["complexite"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Faible">Faible</SelectItem>
                    <SelectItem value="Moyen">Moyen</SelectItem>
                    <SelectItem value="Élevé">Élevé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Séquence</Label>
                <Select value={resForm.sequence_id ?? "__none__"} onValueChange={(v) => setResForm({ ...resForm, sequence_id: v === "__none__" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Séquence" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sans séquence</SelectItem>
                    {sequences.map((s) => <SelectItem key={s.id} value={s.id}>{s.titre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description courte</Label>
              <Textarea value={resForm.description ?? ""} onChange={(e) => setResForm({ ...resForm, description: e.target.value })} rows={2} />
            </div>
            <div className="rounded-md border bg-muted/30 p-3 space-y-3">
              <p className="text-sm font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Contenus (tous optionnels)</p>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5"><FileText className="h-3 w-3" /> Texte enrichi</Label>
                <Textarea value={resForm.contenu_texte ?? ""} onChange={(e) => setResForm({ ...resForm, contenu_texte: e.target.value })} rows={4} placeholder="Contenu textuel..." className="font-mono text-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1.5"><Video className="h-3 w-3" /> Lien vidéo</Label>
                  <Input value={resForm.video_url ?? ""} onChange={(e) => setResForm({ ...resForm, video_url: e.target.value })} placeholder="https://youtube.com/..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1.5"><FileText className="h-3 w-3" /> Document</Label>
                  <Input value={resForm.document_url ?? ""} onChange={(e) => setResForm({ ...resForm, document_url: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5"><ClipboardCheck className="h-3 w-3" /> Évaluation</Label>
                <Input value={resForm.evaluation_url ?? ""} onChange={(e) => setResForm({ ...resForm, evaluation_url: e.target.value })} placeholder="URL de l'évaluation" />
              </div>
            </div>
            <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-sm flex items-center gap-2 flex-wrap">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium">Activité auto-créée à la sauvegarde</span>
              <Badge variant="default">{editingRes ? "Mise à jour" : "Création"} • {resForm.complexite}</Badge>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setResDialogOpen(false)}>Annuler</Button>
            <Button onClick={saveRes} disabled={isSavingRes}>
              {isSavingRes ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingRes ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
