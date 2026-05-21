/**
 * Migration : ajoute la colonne deleted_at (soft delete) sur courses, teachers, resources, sequences.
 *
 * Usage : node scripts/migrate-soft-delete.js
 */

import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false, dialect: 'postgres' });

const tables = ['courses', 'teachers', 'resources', 'sequences', 'payments'];

async function run() {
    await sequelize.authenticate();
    console.log('Connecté.\n');

    for (const table of tables) {
        await sequelize.query(
            `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL`,
            { type: QueryTypes.RAW }
        );
        await sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_${table}_deleted_at ON ${table}(deleted_at)`,
            { type: QueryTypes.RAW }
        );
        console.log(`✓ ${table} — colonne deleted_at ajoutée`);
    }

    console.log('\nMigration soft delete terminée.');
    await sequelize.close();
}

run().catch((err) => { console.error(err); process.exit(1); });
