# backend-pct

API REST pour la gestion des heures des enseignants — Université Virtuelle de Côte d'Ivoire.

Développé avec **Node.js**, **Express**, **PostgreSQL (Neon)** et **Sequelize**. Authentification JWT, rôles, génération de rapports PDF/Excel.

---

## Prérequis

- Node.js 18+
- Un projet PostgreSQL sur [Neon](https://neon.tech) (ou tout autre hôte PostgreSQL compatible SSL)

---

## Installation

```bash
cd backend-pct
npm install
```

Copier le fichier d'exemple et renseigner les variables :

```bash
cp .env.example .env
```

Éditer `.env` :

```env
PORT=3000
NODE_ENV=development

DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

JWT_SECRET=une_cle_secrete_longue_et_aleatoire
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:8080
```

---

## Base de données

### Migrations (créer les tables)

```bash
npm run migrate
```

Exécute `schema.sql` sur la base Neon. Les tables suivantes sont créées :

| Table | Description |
|---|---|
| `teachers` | Enseignants |
| `users` | Comptes avec rôles (`admin`, `secretaire`, `enseignant`) |
| `courses` | Cours (filière, niveau, semestre) |
| `course_teachers` | Liaison cours ↔ enseignants |
| `sequences` | Séquences pédagogiques |
| `resources` | Ressources pédagogiques |
| `activities` | Activités des enseignants (création/mise à jour de ressources) |
| `app_settings` | Paramètres de l'application |
| `notifications` | Notifications utilisateurs |
| `academic_years` | Années académiques |
| `payments` | Historique des paiements |

### Seeders (données initiales)

```bash
npm run seed
```

Insère :
- Un compte **admin** : `admin@univ.dz` / `admin123`
- 3 enseignants d'exemple

### Reset (supprimer et recréer)

```bash
npm run reset
```

---

## Démarrage

```bash
# Développement (rechargement automatique)
npm run dev

# Production
npm start
```

Le serveur démarre sur `http://localhost:3000`.

Test rapide :

```bash
curl http://localhost:3000/api/test
# → { "success": true, "message": "API fonctionne" }
```

---

## Endpoints principaux

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/register` | Création de compte |
| GET | `/api/teachers` | Liste des enseignants |
| GET | `/api/courses` | Liste des cours |
| GET | `/api/activities` | Activités des enseignants |
| GET | `/api/hours` | Récapitulatif des heures |
| GET | `/api/reports` | Génération de rapports (PDF/Excel) |
| GET | `/api/payments` | Historique des paiements |
| GET | `/api/notifications` | Notifications |
| GET | `/api/settings` | Paramètres |
| GET | `/api/academic-years` | Années académiques |

Les routes protégées nécessitent un header `Authorization: Bearer <token>`.

---

## Structure du projet

```
backend-pct/
├── server.js               # Point d'entrée
├── schema.sql              # Schéma de la base de données
├── scripts/
│   ├── migrate.js          # Exécute schema.sql
│   ├── seed.js             # Données initiales
│   └── reset.js            # Reset complet
├── public/                 # Fichiers publics
└── src/
    ├── config/
    │   └── database.js     # Connexion Sequelize
    ├── controllers/        # Logique métier
    ├── middleware/         # Auth JWT, validation
    ├── models/             # Modèles Sequelize
    ├── routes/             # Définition des routes
    └── utils/              # Utilitaires (PDF, Excel, logs)
```

---

## Rôles

| Rôle | Accès |
|---|---|
| `admin` | Accès total |
| `secretaire` | Gestion des enseignants, cours, validation des activités |
| `enseignant` | Consultation de ses propres heures et activités |

---

## Auteur

Emmanuel Kouame
