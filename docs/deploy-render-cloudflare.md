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
| **NODE_VERSION** | `20.15.0` |

### Variables d'environnement (Render → Environment)

Le fichier `.env` n'est **pas** déployé (gitignore). Tout se configure dans le dashboard :

| Variable | Obligatoire | Exemple / note |
|----------|-------------|----------------|
| `DATABASE_URL` | **Oui** | URL Neon ou Postgres Render : `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | **Oui** | Chaîne longue aléatoire (ex. `openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | Non | `7d` |
| `FRONTEND_URL` | **Oui** | URL du site statique Render/Cloudflare, ex. `https://g6-teach-track-web.onrender.com` |
| `NODE_ENV` | Recommandé | `production` |
| `NODE_VERSION` | Recommandé | `20.15.0` |

`PORT` est fourni automatiquement par Render — ne pas le définir.

Après ajout de `DATABASE_URL` : lancer une fois les migrations :

```sh
# Shell Render du service backend, ou en local :
DATABASE_URL="..." npm run migrate -w backend-pct
npm run seed -w backend-pct   # optionnel (données de démo)
```

Puis sur le **frontend** Render, définir :

`VITE_API_URL` = `https://VOTRE-API.onrender.com/api` (URL du Web Service backend + `/api`).

---

## PostgreSQL

- **Neon** (free, durable) — recommandé pour la prod gratuite longue durée.
- **Render Postgres free** — expire au bout de **30 jours**.
