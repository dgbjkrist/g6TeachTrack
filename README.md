# UVCI — UniVirtuelle (monorepo)

| Package | Dossier | Port dev | Rôle |
|---------|---------|----------|------|
| `univirtuelle` | `univirtuelle/` | 8080 | Frontend React (Vite) |
| `backend-pct` | `backend-pct/` | 3000 | API Express + PostgreSQL |

## Démarrage rapide

```sh
# À la racine uvci/
npm install
npm run dev
```

Ou via le script shell :

```sh
chmod +x scripts/dev.sh   # une seule fois
./scripts/dev.sh
```

- API : http://localhost:3000  
- Frontend : http://localhost:8080  

Le backend attend un fichier `backend-pct/.env` (voir `backend-pct/.env.example`).

## Scripts racine

| Commande | Description |
|----------|-------------|
| `npm run dev` | API + frontend en parallèle |
| `npm run dev:api` | API seule |
| `npm run dev:web` | Frontend seul |
| `npm run build` | Build production du frontend |
| `npm run seed` | Données de démo (backend) |
| `npm run migrate` | Migrations DB (backend) |

## Passer en vrai monorepo Git

Aujourd’hui chaque dossier a **son propre dépôt** :

- `univirtuelle` → `github.com/dgbjkrist/univirtuelle`
- `backend-pct` → `github.com/emmanuelkouame1321/backend-pct`

Le dossier `uvci/` n’a pas encore de dépôt Git. Deux approches courantes :

### Option A — Nouveau dépôt (simple, sans historique fusionné)

1. Créer un repo vide sur GitHub (ex. `uvci` ou `univirtuelle-monorepo`).
2. Supprimer les dépôts imbriqués (après sauvegarde / push de tout ce qui est en cours) :

   ```sh
   rm -rf univirtuelle/.git backend-pct/.git
   ```

3. Initialiser à la racine :

   ```sh
   cd /chemin/vers/uvci
   git init
   git add .
   git commit -m "chore: monorepo UniVirtuelle (frontend + API)"
   git remote add origin git@github.com:VOTRE_ORG/uvci.git
   git push -u origin main
   ```

Les anciens repos GitHub peuvent rester en archive ou être marqués deprecated dans leur README.

### Option B — Conserver l’historique (`git subtree`)

Utile si vous voulez garder les commits de chaque ancien repo dans le monorepo :

```sh
cd /chemin/vers/uvci
git init

# Branche par défaut des anciens repos (souvent main)
git subtree add --prefix=backend-pct backend-pct-origin main
git subtree add --prefix=univirtuelle univirtuelle-origin main
```

Ajoutez d’abord les remotes des anciens clones, ou clonez-les dans des dossiers temporaires. Ensuite un seul `origin` pour le monorepo.

### Workspaces npm

`package.json` à la racine déclare les workspaces. Un seul `npm install` à la racine installe et lie les deux packages. Les commandes `-w backend-pct` / `-w univirtuelle` ciblent chaque projet.

Les dossiers `.git` imbriqués **n’empêchent pas** npm workspaces ; ils empêchent seulement Git de voir l’ensemble comme un seul dépôt tant qu’ils existent.
