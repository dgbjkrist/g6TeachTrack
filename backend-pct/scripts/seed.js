import 'dotenv/config';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

const isLocal = !process.env.DATABASE_URL?.includes('neon') && !process.env.DATABASE_URL?.includes('ssl');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false }
});

async function seed() {
    try {
        await client.connect();
        console.log('Insertion des données...');

        // ── Admin ──────────────────────────────────────────────────────────────
        const adminHash = await bcrypt.hash('admin123', 10);
        await client.query(`
            INSERT INTO users (email, password_hash, role, is_active)
            VALUES ($1, $2, 'admin', true)
            ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
        `, ['admin@univ.dz', adminHash]);
        console.log('✓ Admin : admin@univ.dz / admin123');

        // ── Secrétaire ─────────────────────────────────────────────────────────
        const secHash = await bcrypt.hash('sec123', 10);
        await client.query(`
            INSERT INTO users (email, password_hash, role, is_active)
            VALUES ($1, $2, 'secretaire', true)
            ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
        `, ['secretaire@univ.dz', secHash]);
        console.log('✓ Secrétaire : secretaire@univ.dz / sec123');

        // ── Enseignants (teachers + comptes users liés) ────────────────────────
        const teachers = [
            { nom: 'Hadj',   prenom: 'Karim',  email: 'k.hadj@univ.dz',    grade: 'Professeur',       statut: 'Permanent', departement: 'Informatique',  taux: 3500, tel: '0555123456', password: 'hadj123' },
            { nom: 'Bouzid', prenom: 'Amina',  email: 'a.bouzid@univ.dz',  grade: 'Maître-Assistant', statut: 'Permanent', departement: 'Mathématiques', taux: 2800, tel: '0555234567', password: 'bouzid123' },
            { nom: 'Cherif', prenom: 'Mohamed',email: 'm.cherif@univ.dz',  grade: 'Assistant',         statut: 'Vacataire', departement: 'Physique',      taux: 2000, tel: '0555345678', password: 'cherif123' },
        ];

        for (const t of teachers) {
            // Insérer le teacher
            const res = await client.query(`
                INSERT INTO teachers (nom, prenom, email, grade, statut, departement, taux_horaire, telephone)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (email) DO UPDATE SET
                    nom = EXCLUDED.nom, prenom = EXCLUDED.prenom,
                    grade = EXCLUDED.grade, statut = EXCLUDED.statut,
                    departement = EXCLUDED.departement, taux_horaire = EXCLUDED.taux_horaire
                RETURNING id
            `, [t.nom, t.prenom, t.email, t.grade, t.statut, t.departement, t.taux, t.tel]);

            const teacherId = res.rows[0].id;

            // Créer le compte user lié
            const hash = await bcrypt.hash(t.password, 10);
            await client.query(`
                INSERT INTO users (email, password_hash, role, is_active, teacher_id)
                VALUES ($1, $2, 'enseignant', true, $3)
                ON CONFLICT (email) DO UPDATE SET
                    password_hash = EXCLUDED.password_hash,
                    teacher_id = EXCLUDED.teacher_id
            `, [t.email, hash, teacherId]);

            console.log(`✓ Enseignant : ${t.email} / ${t.password}`);
        }

        console.log('\nSeed terminé ✓');
        process.exit(0);
    } catch (error) {
        console.error('Erreur :', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

seed();
