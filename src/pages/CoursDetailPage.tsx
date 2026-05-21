import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCourses } from "@/hooks/useCourses";
import { useSequences } from "@/hooks/useSequences";
import { useResources } from "@/hooks/useResources";
import { BackendResource } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, BookOpen, Info, Lock, Loader2, Eye } from "lucide-react";
import { ResourceContentDialog, ResourceIndicators, resourceTypeIcon } from "@/components/ResourceContentDialog";

export default function CoursDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viewResource, setViewResource] = useState<BackendResource | null>(null);

  const { data: coursesData, isLoading: loadingCourse } = useCourses();
  const { data: seqData, isLoading: loadingSeq } = useSequences(id);
  const { data: resData, isLoading: loadingRes } = useResources(id);

  const course = coursesData?.data.find((c) => c.id === id);
  const sequences = seqData?.data ?? [];
  const resources = resData?.data ?? [];

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
        <p className="text-muted-foreground">Cours introuvable</p>
        <Button variant="outline" onClick={() => navigate("/cours")}>Retour</Button>
      </div>
    );
  }

  const sortedSeq = [...sequences].sort((a, b) => a.ordre - b.ordre);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cours")} className="mt-1">
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

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Vue secrétaire — consultation uniquement. Le contenu pédagogique est créé par les enseignants attribués depuis leur espace « Mes cours ».
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-primary">{course.teachers.length}</p><p className="text-xs text-muted-foreground">Enseignant{course.teachers.length !== 1 ? "s" : ""}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-primary">{sequences.length}</p><p className="text-xs text-muted-foreground">Séquences</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-primary">{resources.length}</p><p className="text-xs text-muted-foreground">Ressources</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-primary">{course.nombre_heures}h</p><p className="text-xs text-muted-foreground">Volume horaire</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Enseignants attribués</CardTitle></CardHeader>
        <CardContent className="pt-0">
          {course.teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun enseignant attribué.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {course.teachers.map((t) => (
                <Badge key={t.id} variant="secondary" className="text-sm py-1">{t.prenom} {t.nom} • {t.grade}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="h-5 w-5" /> Séquences pédagogiques
        </h2>
        <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" /> Lecture seule</Badge>
      </div>

      {loadingSeq || loadingRes ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement du contenu...</div>
      ) : sortedSeq.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Aucune séquence créée.</CardContent></Card>
      ) : (
        sortedSeq.map((seq) => {
          const seqRes = resources.filter((r) => r.sequence_id === seq.id);
          return (
            <Card key={seq.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">#{seq.ordre}</Badge>
                  {seq.titre}
                  <Badge variant="outline" className="text-xs">{seqRes.length} ressource{seqRes.length !== 1 ? "s" : ""}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {seqRes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune ressource.</p>
                ) : (
                  <div className="space-y-2">
                    {seqRes.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50 group">
                        <span className="text-muted-foreground shrink-0">{resourceTypeIcon[r.type]}</span>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm font-medium truncate">{r.titre}</p>
                          {r.description && <p className="text-xs text-muted-foreground truncate">{r.description}</p>}
                          <ResourceIndicators resource={r} />
                        </div>
                        <Badge variant={r.complexite === "Élevé" ? "destructive" : r.complexite === "Moyen" ? "default" : "secondary"} className="text-xs shrink-0">
                          {r.complexite}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setViewResource(r)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      <ResourceContentDialog resource={viewResource} onClose={() => setViewResource(null)} />
    </div>
  );
}
