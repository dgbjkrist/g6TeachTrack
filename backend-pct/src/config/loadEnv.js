import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Fichier .env en local ; sur Render les variables viennent du dashboard (ne pas écraser process.env)
dotenv.config({ path: path.join(backendRoot, '.env') });

const isRender = Boolean(process.env.RENDER);

function envHint(name) {
  if (isRender) {
    return `Ajoutez « ${name} » dans Render → votre service backend → Environment.`;
  }
  return `Créez backend-pct/.env (voir .env.example) : cp backend-pct/.env.example backend-pct/.env`;
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Variable d'environnement manquante : ${name}. ${envHint(name)}`);
  }
  return value;
}

export { backendRoot };
