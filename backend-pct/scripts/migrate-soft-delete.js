// scripts/migrate-soft-delete.js
import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const tables = ['courses', 'teachers', 'resources', 'sequences', 'payments'];

async function run() {
    try {
        await client.connect();

        for (const table of tables) {
            await client.query(`
                ALTER TABLE ${table}
                ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
            `);

            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_${table}_deleted_at
                ON ${table}(deleted_at);
            `);

            console.log(`✔ ${table}`);
        }

        console.log('✔ soft delete done');
    } catch (err) {
        console.error(err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();