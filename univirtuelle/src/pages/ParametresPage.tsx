import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useTeachers } from "@/hooks/useTeachers";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { ChangePasswordSection } from "@/components/ChangePasswordSection";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton-blocks";

function CreateAccountSection() {
  const { data: teachersData } = useTeachers();
  const teachers = teachersData?.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"secretaire" | "enseignant">("secretaire");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCreate = async () => {
    if (mode === "secretaire" && (!email || !password)) {
      toast.error("Tous les champs sont requis");
      return;
    }
    if (mode === "enseignant" && (!teacherId || !password)) {
      toast.error("Tous les champs sont requis");
      return;
    }
    setLoading(true);
    try {
      if (mode === "secretaire") {
        await api.post("/auth/create-secretaire", { email, password });
        toast.success(`Compte secrétaire créé — ${email}`);
      } else {
        const res = await api.post<{ message: string }>("/auth/create-enseignant-account", {
          teacher_id: teacherId,
          password,
        });
        toast.success(res.message);
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Gestion des comptes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Créez des comptes secrétaire ou activez la connexion d'un enseignant.
          La réinitialisation du mot de passe se fait sur la fiche de l'enseignant.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => { setMode("secretaire"); setDialogOpen(true); }} variant="outline" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" /> Nouveau secrétaire
          </Button>
          <Button onClick={() => { setMode("enseignant"); setDialogOpen(true); }} variant="outline" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" /> Activer un enseignant
          </Button>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "secretaire" ? "Créer un compte secrétaire" : "Activer la connexion d'un enseignant"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {mode === "secretaire" ? (
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="secretaire@univ.dz" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Enseignant</Label>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.prenom} {t.nom} — {t.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Mot de passe (min. 6 caractères)</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function RateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="number" min={0} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default function ParametresPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: settingsData, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [heuresNormales, setHeuresNormales] = useState("240");
  const [multCreation, setMultCreation] = useState("5");
  const [multMaj, setMultMaj] = useState("2");
  const [rates, setRates] = useState({
    hourly_rate_assistant_permanent: "2000",
    hourly_rate_maitre_permanent: "2800",
    hourly_rate_professor_permanent: "3500",
    hourly_rate_assistant_vacataire: "1500",
    hourly_rate_maitre_vacataire: "2200",
    hourly_rate_professor_vacataire: "2800",
  });

  useEffect(() => {
    const s = settingsData?.data;
    if (!s) return;
    if (s.normal_hours_quota) setHeuresNormales(s.normal_hours_quota);
    if (s.base_hours_creation) setMultCreation(s.base_hours_creation);
    if (s.base_hours_update) setMultMaj(s.base_hours_update);
    setRates((prev) => ({
      hourly_rate_assistant_permanent: s.hourly_rate_assistant_permanent ?? prev.hourly_rate_assistant_permanent,
      hourly_rate_maitre_permanent: s.hourly_rate_maitre_permanent ?? prev.hourly_rate_maitre_permanent,
      hourly_rate_professor_permanent: s.hourly_rate_professor_permanent ?? prev.hourly_rate_professor_permanent,
      hourly_rate_assistant_vacataire: s.hourly_rate_assistant_vacataire ?? prev.hourly_rate_assistant_vacataire,
      hourly_rate_maitre_vacataire: s.hourly_rate_maitre_vacataire ?? prev.hourly_rate_maitre_vacataire,
      hourly_rate_professor_vacataire: s.hourly_rate_professor_vacataire ?? prev.hourly_rate_professor_vacataire,
    }));
  }, [settingsData]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        normal_hours_quota: heuresNormales,
        base_hours_creation: multCreation,
        base_hours_update: multMaj,
        ...rates,
      });
      toast.success("Paramètres enregistrés — taux horaires appliqués à tous les enseignants");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{isAdmin ? "Paramètres" : "Mon compte"}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAdmin ? "Configuration globale de l'application" : "Gestion de votre mot de passe"}
        </p>
      </div>

      {isAdmin && (
        <>
          <CreateAccountSection />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Taux horaires (F CFA)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Source unique des taux : chaque enseignant reçoit automatiquement le montant correspondant à son{" "}
                <Badge variant="secondary">grade</Badge> et son <Badge variant="secondary">statut</Badge>.
                À l'enregistrement, tous les enseignants sont resynchronisés.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-medium text-sm">Permanents</h3>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                  ) : (
                    <>
                      <RateInput label="Assistant" value={rates.hourly_rate_assistant_permanent} onChange={(v) => setRates({ ...rates, hourly_rate_assistant_permanent: v })} />
                      <RateInput label="Maître-Assistant" value={rates.hourly_rate_maitre_permanent} onChange={(v) => setRates({ ...rates, hourly_rate_maitre_permanent: v })} />
                      <RateInput label="Professeur" value={rates.hourly_rate_professor_permanent} onChange={(v) => setRates({ ...rates, hourly_rate_professor_permanent: v })} />
                    </>
                  )}
                </div>
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-medium text-sm">Vacataires</h3>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                  ) : (
                    <>
                      <RateInput label="Assistant" value={rates.hourly_rate_assistant_vacataire} onChange={(v) => setRates({ ...rates, hourly_rate_assistant_vacataire: v })} />
                      <RateInput label="Maître-Assistant" value={rates.hourly_rate_maitre_vacataire} onChange={(v) => setRates({ ...rates, hourly_rate_maitre_vacataire: v })} />
                      <RateInput label="Professeur" value={rates.hourly_rate_professor_vacataire} onChange={(v) => setRates({ ...rates, hourly_rate_professor_vacataire: v })} />
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Quota annuel</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Heures normales par enseignant</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input type="number" value={heuresNormales} onChange={(e) => setHeuresNormales(e.target.value)} />
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Règles de calcul des heures</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </>
                ) : (
                  <>
                    <RateInput label="Base heures — Création" value={multCreation} onChange={setMultCreation} />
                    <RateInput label="Base heures — Mise à jour" value={multMaj} onChange={setMultMaj} />
                  </>
                )}
                <p className="text-xs text-muted-foreground">Complexité : Faible ×1, Moyen ×1,5, Élevé ×2</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateSettings.isPending || isLoading}>
              {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer les paramètres
            </Button>
          </div>
        </>
      )}

      <ChangePasswordSection />
    </div>
  );
}
