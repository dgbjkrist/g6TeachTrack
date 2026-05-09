import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function reset() {
    try {
        await client.connect();
        console.log('Suppression de toutes les tables...');

        // Récupérer toutes les tables du schéma public
        const res = await client.query(`
            SELECT tablename FROM pg_tables WHERE schemaname = 'public';
        `);
        for (const row of res.rows) {
            const table = row.tablename;
            await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
            console.log(`   - Table ${table} supprimée`);
        }

        console.log('Reset terminé, toutes les tables ont été supprimées.');
        process.exit(0);
    } catch (error) {
        console.error('Erreur reset:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

reset();