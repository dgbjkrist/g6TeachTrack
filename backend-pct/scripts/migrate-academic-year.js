import 'dotenv/config';
import { Client } from 'pg';

const isLocal = !process.env.DATABASE_URL?.includes('neon') && !process.env.DATABASE_URL?.includes('ssl');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false }
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connecté à la base de données');

        // ── activities : ajouter academic_year_id ─────────────────────────────
        await client.query(`
            ALTER TABLE activities
            ADD COLUMN IF NOT EXISTS academic_year_id UUID
                REFERENCES academic_years(id)
                ON DELETE SET NULL;
        `);
        console.log('✓ activities.academic_year_id ajouté');

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_activities_academic_year
            ON activities(academic_year_id);
        `);
        console.log('✓ index activities.academic_year_id créé');

        // ── course_teachers : ajouter academic_year_id ────────────────────────
        await client.query(`
            ALTER TABLE course_teachers
            ADD COLUMN IF NOT EXISTS academic_year_id UUID
                REFERENCES academic_years(id)
                ON DELETE SET NULL;
        `);
        console.log('✓ course_teachers.academic_year_id ajouté');

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_course_teachers_academic_year
            ON course_teachers(academic_year_id);
        `);
        console.log('✓ index course_teachers.academic_year_id créé');

        console.log('\nMigration academic_year terminée ✓');
        process.exit(0);
    } catch (error) {
        console.error('Erreur migration :', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
