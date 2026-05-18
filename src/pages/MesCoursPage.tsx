import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { useMyHours } from "@/hooks/useHours";
import { useSequences } from "@/hooks/useSequences";
import { useResources } from "@/hooks/useResources";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Eye, Clock, FileText, Layers, Loader2 } from "lucide-react";
import { BackendCourse } from "@/lib/api";

function CourseCard({ course }: { course: BackendCourse }) {
  const navigate = useNavigate();
  const { data: seqData } = useSequences(course.id);
  const { data: resData } = useResources(course.id);
  const seqCount = seqData?.data.length ?? 0;
  const resCount = resData?.data.length ?? 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{course.intitule}</CardTitle>
          <Badge variant="secondary">{course.niveau}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          <Badge variant="outline">S{course.semestre}</Badge>
          <span className="text-xs text-muted-foreground">{course.filiere}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span>{seqCount} séquence{seqCount !== 1 ? "s" : ""}</span>
          <span>{resCount} ressource{resCount !== 1 ? "s" : ""}</span>
          <span>{course.nombre_heures}h</span>
        </div>
        <Button variant="default" size="sm" className="gap-2 w-full" onClick={() => navigate(`/mes-cours/${course.id}`)}>
          <Eye className="h-4 w-4" /> Gérer le contenu
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MesCoursPage() {
  const { user } = useAuth();
  const { data: coursesData, isLoading } = useCourses();
  const { data: hoursData } = useMyHours();

  const allCourses = coursesData?.data ?? [];
  const mesCours = allCourses.filter((c) =>
    c.teachers.some((t) => t.id === user?.teacher_id)
  );
  const hours = hoursData?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mes cours</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {mesCours.length} cours attribué{mesCours.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-4 text-center"><BookOpen className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold text-primary">{mesCours.length}</p><p className="text-xs text-muted-foreground">Cours</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center"><Layers className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold text-primary">—</p><p className="text-xs text-muted-foreground">Séquences</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center"><FileText className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold text-primary">—</p><p className="text-xs text-muted-foreground">Ressources</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center"><Clock className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold text-primary">{hours?.total ?? 0}h</p><p className="text-xs text-muted-foreground">Heures validées</p></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement...</div>
      ) : mesCours.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aucun cours ne vous est attribué pour le moment.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mesCours.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      )}
    </div>
  );
}
