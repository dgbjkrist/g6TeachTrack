import { useNotifications, useMarkAsRead } from "@/hooks/useNotifications";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle, Info, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const typeIcon = (type: string) => {
  if (type.includes("quota")) return AlertTriangle;
  if (type.includes("valid")) return CheckCircle;
  if (type.includes("pending")) return Clock;
  return Info;
};

const typeColor = (type: string) => {
  if (type.includes("quota")) return "text-destructive";
  if (type.includes("valid")) return "text-emerald-600";
  if (type.includes("pending")) return "text-primary";
  return "text-muted-foreground";
};

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead.mutateAsync(id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground text-sm mt-1">{unreadCount} non lue{unreadCount !== 1 ? "s" : ""}</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune notification</CardContent></Card>
      )}

      <div className="space-y-3">
        {notifications.map((n) => {
          const Icon = typeIcon(n.type ?? "");
          const color = typeColor(n.type ?? "");
          const timeAgo = formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr });
          return (
            <Card key={n.id} className={!n.is_read ? "border-primary/20 bg-accent/30" : ""}>
              <CardContent className="flex items-start gap-4 py-4">
                <div className={`mt-0.5 ${color}`}><Icon className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.is_read && <Badge variant="default" className="text-[10px] px-1.5 py-0">Nouveau</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                </div>
                {!n.is_read && (
                  <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={() => handleMarkRead(n.id)}>
                    Marquer lu
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
