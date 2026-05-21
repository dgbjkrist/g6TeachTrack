# Déploiement Render + Cloudflare

## Frontend sur Render (Static Site)

Copier **exactement** ces valeurs dans le dashboard Render :

| Champ | Valeur |
|-------|--------|
| **Root Directory** | `univirtuelle` |
| **Build Command** | `npm ci && npm run build` |
| **Publish Directory** | `dist` |
| **Environment → NODE_VERSION** | `20.15.0` |

> **Ne pas utiliser** `build` comme Publish Directory (Vite sort dans **`dist`**).  
> **Ne pas laisser** Node 24 par défaut (erreur `@rollup/rollup-linux-x64-gnu`).

Pousser sur GitHub avant redeploy : `.node-version`, `package.json` avec `@rollup/rollup-linux-x64-gnu`, et `package-lock.json` à jour.

### Variables d'environnement (Render → Static Site)

| Variable | Exemple |
|----------|---------|
| `VITE_API_URL` | `https://votre-backend.onrender.com/api` |

### Alternative : build depuis la racine du monorepo

| Champ | Valeur |
|-------|--------|
| **Root Directory** | *(vide)* |
| **Build Command** | `npm ci && npm run build -w univirtuelle` |
| **Publish Directory** | `univirtuelle/dist` |

---

## Frontend sur Cloudflare Pages (recommandé)

| Champ | Valeur |
|-------|--------|
| **Root directory** | `univirtuelle` |
| **Build command** | `npm ci && npm run build` |
| **Build output** | `dist` |
| **Node version** | `20` (variable `NODE_VERSION=20`) |

Variable : `VITE_API_URL` = URL de l'API Render.

Fichier `public/_redirects` : routage SPA (`/* → index.html`).

---

## Backend sur Render (Web Service)

| Champ | Valeur |
|-------|--------|
| **Root Directory** | `backend-pct` |
| **Build Command** | `npm ci` |
| **Start Command** | `npm start` |

Variables : `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`.

Après création de la BDD : lancer une fois `npm run migrate` (shell Render ou en local avec `DATABASE_URL` prod).

---

## PostgreSQL

- **Neon** (free, durable) — recommandé pour la prod gratuite longue durée.
- **Render Postgres free** — expire au bout de **30 jours**.
