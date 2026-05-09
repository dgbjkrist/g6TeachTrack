import 'dotenv/config';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    try {
        await client.connect();
        console.log('Insertion des données...');

        // Admin avec mot de passe admin123
        const adminEmail = 'admin@univ.dz';
        const adminPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        await client.query(`
            INSERT INTO users (email, password_hash, role, is_active)
            VALUES ($1, $2, 'admin', true)
            ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
        `, [adminEmail, hashedPassword]);
        console.log('Admin créé/mis à jour');

        // Enseignants (exemple)
        const teachers = [
            ['Hadj', 'Karim', 'k.hadj@univ.dz', 'Professeur', 'Permanent', 'Informatique', 3500, '0555123456'],
            ['Bouzid', 'Amina', 'a.bouzid@univ.dz', 'Maître-Assistant', 'Permanent', 'Mathématiques', 2800, '0555234567'],
            ['Cherif', 'Mohamed', 'm.cherif@univ.dz', 'Assistant', 'Vacataire', 'Physique', 2000, '0555345678']
        ];
        for (const t of teachers) {
            await client.query(`
                INSERT INTO teachers (nom, prenom, email, grade, statut, departement, taux_horaire, telephone)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (email) DO NOTHING
            `, t);
        }
        console.log('Enseignants ajoutés');

        console.log('Seed terminé');
        process.exit(0);
    } catch (error) {
        console.error('Erreur :', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

seed();