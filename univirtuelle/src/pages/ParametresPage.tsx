import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useTeachers } from "@/hooks/useTeachers";
import { UserPlus, Loader2 } from "lucide-react";

// ─── Création de comptes ──────────────────────────────────────────────────────

function CreateAccountSection() {
  const { data: teachersData } = useTeachers();
  const teachers = teachersData?.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"secretaire" | "enseignant">("secretaire");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(false);

  const openSecretaire = () => { setMode("secretaire"); setEmail(""); setPassword(""); setDialogOpen(true); };
  const openEnseignant = () => { setMode("enseignant"); setTeacherId(""); setPassword(""); setDialogOpen(true); };

  const handleCreate = async () => {
    if (mode === "secretaire") {
      if (!email || !password) { toast.error("Tous les champs sont requis"); return; }
    } else {
      if (!teacherId || !password) { toast.error("Tous les champs sont requis"); return; }
    }
    setLoading(true);
    try {
      if (mode === "secretaire") {
        await api.post("/auth/create-secretaire", { email, password });
        toast.success(`Compte secrétaire créé — ${email}`);
      } else {
        const res = await api.post<{ message: string }>("/auth/create-enseignant-account", { teacher_id: teacherId, password });
        toast.success((res as { message: string }).message);
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
          Créez des comptes pour les secrétaires et activez la connexion des enseignants déjà enregistrés.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={openSecretaire} variant="outline" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" /> Nouveau secrétaire
          </Button>
          <Button onClick={openEnseignant} variant="outline" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" /> Activer un enseignant
          </Button>
        </div>

        <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1 text-muted-foreground">
          <p className="font-medium text-foreground text-sm">Comment ça fonctionne</p>
          <p><Badge variant="secondary" className="text-xs mr-1">Secrétaire</Badge>Renseigne un email et mot de passe → le compte est créé directement.</p>
          <p><Badge variant="secondary" className="text-xs mr-1">Enseignant</Badge>Sélectionne un enseignant déjà enregistré → son email devient son identifiant de connexion.</p>
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
                  <SelectTrigger><SelectValue placeholder="Sélectionner un enseignant" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.prenom} {t.nom} — {t.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {teacherId && (
                  <p className="text-xs text-muted-foreground">
                    L'identifiant de connexion sera l'email de l'enseignant.
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label>Mot de passe (minimum 6 caractères)</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Créer le compte
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ParametresPage() {
  const [annee, setAnnee] = useState("2024/2025");
  const [heuresNormales, setHeuresNormales] = useState(240);
  const [tauxAssistant, setTauxAssistant] = useState(2000);
  const [tauxMaitre, setTauxMaitre] = useState(2800);
  const [tauxProf, setTauxProf] = useState(3500);
  const [multCreation, setMultCreation] = useState(5);
  const [multMaj, setMultMaj] = useState(2);

  const handleSave = () => toast.success("Paramètres enregistrés");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-1">Configuration de l'application</p>
      </div>

      <CreateAccountSection />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Année académique</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Année en cours</Label>
              <Input value={annee} onChange={(e) => setAnnee(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Heures normales (quota)</Label>
              <Input type="number" value={heuresNormales} onChange={(e) => setHeuresNormales(Number(e.target.value))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Taux horaires (F CFA)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Assistant</Label>
              <Input type="number" value={tauxAssistant} onChange={(e) => setTauxAssistant(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Maître-Assistant</Label>
              <Input type="number" value={tauxMaitre} onChange={(e) => setTauxMaitre(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Professeur</Label>
              <Input type="number" value={tauxProf} onChange={(e) => setTauxProf(Number(e.target.value))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Règles de calcul</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Base heures — Création</Label>
              <Input type="number" value={multCreation} onChange={(e) => setMultCreation(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Base heures — Mise à jour</Label>
              <Input type="number" value={multMaj} onChange={(e) => setMultMaj(Number(e.target.value))} />
            </div>
            <p className="text-xs text-muted-foreground">
              Multiplicateurs de complexité : Faible ×1, Moyen ×1.5, Élevé ×2
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Enregistrer les paramètres</Button>
      </div>
    </div>
  );
}
