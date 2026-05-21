import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BackendResource } from "@/lib/api";
import { FileText, Video, ExternalLink, ClipboardCheck, HelpCircle, Gamepad2 } from "lucide-react";

// ─── Video embed helper ───────────────────────────────────────────────────────

function getYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

function VideoPlayer({ url }: { url: string }) {
  const ytId = getYoutubeId(url);
  if (ytId) {
    return (
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full rounded-md"
          src={`https://www.youtube.com/embed/${ytId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Vidéo YouTube"
        />
      </div>
    );
  }

  const vimeoId = getVimeoId(url);
  if (vimeoId) {
    return (
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full rounded-md"
          src={`https://player.vimeo.com/video/${vimeoId}`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Vidéo Vimeo"
        />
      </div>
    );
  }

  if (isDirectVideo(url)) {
    return (
      <video controls className="w-full rounded-md max-h-72">
        <source src={url} />
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>
    );
  }

  // Fallback: lien cliquable
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-primary hover:underline break-all">
      <ExternalLink className="h-3.5 w-3.5 shrink-0" />{url}
    </a>
  );
}

// ─── Content indicators ───────────────────────────────────────────────────────

export function ResourceIndicators({ resource }: { resource: BackendResource }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {resource.contenu_texte && (
        <span title="Contenu texte" className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          <FileText className="h-3 w-3" /> Texte
        </span>
      )}
      {resource.video_url && (
        <span title="Vidéo" className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <Video className="h-3 w-3" /> Vidéo
        </span>
      )}
      {resource.document_url && (
        <span title="Document" className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          <ExternalLink className="h-3 w-3" /> Doc
        </span>
      )}
      {resource.evaluation_url && (
        <span title="Évaluation" className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
          <ClipboardCheck className="h-3 w-3" /> Éval.
        </span>
      )}
      {resource.quiz && resource.quiz.length > 0 && (
        <span title="Quiz" className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
          <HelpCircle className="h-3 w-3" /> Quiz
        </span>
      )}
    </div>
  );
}

// ─── Type icon map ────────────────────────────────────────────────────────────

export const resourceTypeIcon: Record<string, React.ReactNode> = {
  "Texte": <FileText className="h-4 w-4" />,
  "Vidéo": <Video className="h-4 w-4" />,
  "Document": <ExternalLink className="h-4 w-4" />,
  "Quiz": <HelpCircle className="h-4 w-4" />,
  "Activité interactive": <Gamepad2 className="h-4 w-4" />,
  "Évaluation": <ClipboardCheck className="h-4 w-4" />,
};

// ─── Content dialog ───────────────────────────────────────────────────────────

interface Props {
  resource: BackendResource | null;
  onClose: () => void;
}

export function ResourceContentDialog({ resource, onClose }: Props) {
  if (!resource) return null;

  const hasContent =
    resource.contenu_texte ||
    resource.video_url ||
    resource.document_url ||
    resource.evaluation_url ||
    (resource.quiz && resource.quiz.length > 0);

  return (
    <Dialog open={!!resource} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground">
              {resourceTypeIcon[resource.type] ?? <FileText className="h-4 w-4" />}
            </span>
            {resource.titre}
            <Badge variant={resource.complexite === "Élevé" ? "destructive" : resource.complexite === "Moyen" ? "default" : "secondary"} className="text-xs">
              {resource.complexite}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {resource.description && (
          <p className="text-sm text-muted-foreground border-b pb-3">{resource.description}</p>
        )}

        {!hasContent && (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun contenu renseigné pour cette ressource.</p>
        )}

        <div className="space-y-5">
          {resource.contenu_texte && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Contenu textuel
              </p>
              <div className="rounded-md bg-muted/50 p-4 text-sm whitespace-pre-wrap leading-relaxed font-mono">
                {resource.contenu_texte}
              </div>
            </section>
          )}

          {resource.video_url && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" /> Vidéo
              </p>
              <VideoPlayer url={resource.video_url} />
            </section>
          )}

          {resource.document_url && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" /> Document
              </p>
              <a
                href={resource.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline break-all"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {resource.document_url}
              </a>
            </section>
          )}

          {resource.evaluation_url && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5" /> Évaluation
              </p>
              <a
                href={resource.evaluation_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline break-all"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {resource.evaluation_url}
              </a>
            </section>
          )}

          {resource.quiz && resource.quiz.length > 0 && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5" /> Quiz ({resource.quiz.length} question{resource.quiz.length !== 1 ? "s" : ""})
              </p>
              <div className="rounded-md bg-muted/50 p-4 text-sm font-mono overflow-x-auto">
                <pre>{JSON.stringify(resource.quiz, null, 2)}</pre>
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
