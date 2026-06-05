import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api, getUsers, resetUserPassword, changeOwnPassword, BackendUser } from "@/lib/api";
import { useTeachers } from "@/hooks/useTeachers";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// ─── Changement de mot de passe (tout le monde) ──────────────────────────────
function ChangePasswordSection() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Tous les champs sont obligatoires");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setLoading(true);
    try {
      await changeOwnPassword(oldPassword, newPassword);
      toast.success("Mot de passe modifié avec succès");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors du changement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Changer mon mot de passe</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mot de passe actuel</Label>
            <div className="relative">
              <Input
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nouveau mot de passe (min. 6 caractères)</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Confirmer le nouveau mot de passe</Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mettre à jour
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}

// ─── Création de comptes (admin uniquement) ──────────────────────────────────
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

  const openSecretaire = () => {
    setMode("secretaire");
    setEmail("");
    setPassword("");
    setDialogOpen(true);
  };
  const openEnseignant = () => {
    setMode("enseignant");
    setTeacherId("");
    setPassword("");
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (mode === "secretaire") {
      if (!email || !password) {
        toast.error("Tous les champs sont requis");
        return;
      }
    } else {
      if (!teacherId || !password) {
        toast.error("Tous les champs sont requis");
        return;
      }
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
          <div className="font-medium text-foreground text-sm">Comment ça fonctionne</div>
          <div><Badge variant="secondary" className="text-xs mr-1">Secrétaire</Badge>Renseigne un email et mot de passe → le compte est créé directement.</div>
          <div><Badge variant="secondary" className="text-xs mr-1">Enseignant</Badge>Sélectionne un enseignant déjà enregistré → son email devient son identifiant de connexion.</div>
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
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="secretaire@univ.dz"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Enseignant</Label>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un enseignant" />
                  </SelectTrigger>
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
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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

// ─── Gestion des utilisateurs (admin uniquement) ─────────────────────────────
function UserManagementSection() {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // pour l’icône œil

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getUsers();
        setUsers(res.data);
      } catch (err) {
        toast.error("Impossible de charger les utilisateurs");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleResetPassword = async () => {
    if (!resetUserId) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setSubmitting(true);
    try {
      await resetUserPassword(resetUserId, newPassword);
      toast.success("Mot de passe réinitialisé avec succès");
      setResetUserId(null);
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de la réinitialisation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Gestion des utilisateurs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2 px-3">Email</th>
                <th className="text-left py-2 px-3">Rôle</th>
                <th className="text-left py-2 px-3">Enseignant associé</th>
                <th className="text-right py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="py-2 px-3">{user.email}</td>
                  <td className="py-2 px-3 capitalize">{user.role}</td>
                  <td className="py-2 px-3">
                    {user.teacher ? `${user.teacher.prenom} ${user.teacher.nom}` : "-"}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <Dialog open={resetUserId === user.id} onOpenChange={(open) => !open && setResetUserId(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setResetUserId(user.id)}>
                          Réinitialiser
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Nouveau mot de passe (min. 6 caractères)</Label>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setResetUserId(null)}>
                              Annuler
                            </Button>
                            <Button onClick={handleResetPassword} disabled={submitting}>
                              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Enregistrer
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ParametresPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [annee, setAnnee] = useState("2024/2025");
  const [heuresNormales, setHeuresNormales] = useState("240");
  const [tauxAssistant, setTauxAssistant] = useState("2000");
  const [tauxMaitre, setTauxMaitre] = useState("2800");
  const [tauxProf, setTauxProf] = useState("3500");
  const [multCreation, setMultCreation] = useState("5");
  const [multMaj, setMultMaj] = useState("2");

  const handleSave = () => {
    const payload = {
      normal_hours_quota: Number(heuresNormales),
      hourly_rate_assistant: Number(tauxAssistant),
      hourly_rate_maitre: Number(tauxMaitre),
      hourly_rate_professor: Number(tauxProf),
      base_hours_creation: Number(multCreation),
      base_hours_update: Number(multMaj),
    };
    // TODO: appel API PUT /api/settings
    console.log("Paramètres sauvegardés :", payload);
    toast.success("Paramètres enregistrés (simulation)");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAdmin ? "Configuration de l'application" : "Gestion de votre compte"}
        </p>
      </div>



      {/* Sections réservées à l'administrateur */}
      {isAdmin && (
        <>
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
                  <Input
                    type="number"
                    value={heuresNormales}
                    onChange={(e) => setHeuresNormales(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Taux horaires (F CFA)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Assistant</Label>
                  <Input
                    type="number"
                    value={tauxAssistant}
                    onChange={(e) => setTauxAssistant(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maître-Assistant</Label>
                  <Input
                    type="number"
                    value={tauxMaitre}
                    onChange={(e) => setTauxMaitre(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Professeur</Label>
                  <Input
                    type="number"
                    value={tauxProf}
                    onChange={(e) => setTauxProf(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Règles de calcul</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Base heures — Création</Label>
                  <Input
                    type="number"
                    value={multCreation}
                    onChange={(e) => setMultCreation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Base heures — Mise à jour</Label>
                  <Input
                    type="number"
                    value={multMaj}
                    onChange={(e) => setMultMaj(e.target.value)}
                  />
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

          <UserManagementSection />
        </>
      )}

      {/* Section changement de mot de passe - visible par tous */}
      <ChangePasswordSection />
    </div>
  );
}