import 'dotenv/config';
import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isLocal = !process.env.DATABASE_URL?.includes('neon') && !process.env.DATABASE_URL?.includes('ssl');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('Connexion à Neon...');
        await client.connect();
        console.log('Connecté');

        const sql = readFileSync(join(__dirname, '..', 'schema.sql'), 'utf8');
        console.log('Exécution du script SQL...');
        await client.query(sql);
        
        console.log('Migration terminée avec succès !');
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de la migration :', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();