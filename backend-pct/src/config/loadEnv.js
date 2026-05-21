import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

dotenv.config({ path: path.join(backendRoot, '.env') });

export function requireEnv(name) {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. ` +
        `Créez backend-pct/.env (voir .env.example) ou copiez : cp backend-pct/.env.example backend-pct/.env`
    );
  }
  return value;
}

export { backendRoot };
