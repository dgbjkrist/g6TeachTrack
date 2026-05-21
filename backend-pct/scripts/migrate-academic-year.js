// scripts/migrate-academic-year.js
import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected');

        await client.query(`
            CREATE TABLE IF NOT EXISTS academic_years (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                year_label TEXT,
                start_date TIMESTAMP,
                end_date TIMESTAMP
            );
        `);

        await client.query(`
            ALTER TABLE activities
            ADD COLUMN IF NOT EXISTS academic_year_id UUID;
        `);

        await client.query(`
            ALTER TABLE course_teachers
            ADD COLUMN IF NOT EXISTS academic_year_id UUID;
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_activities_academic_year
            ON activities(academic_year_id);
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_course_teachers_academic_year
            ON course_teachers(academic_year_id);
        `);

        console.log('✔ academic_year migration done');
    } catch (err) {
        console.error(err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();