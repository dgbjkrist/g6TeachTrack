/**
 * Migration unique : assigne les enregistrements sans année (academic_year_id = NULL)
 * à la première année académique (la plus ancienne par start_date).
 *
 * Usage : node scripts/migrate-legacy-year.js
 * Options : --dry-run  (affiche ce qui serait modifié sans rien changer)
 */

import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false, dialect: 'postgres' });

const dryRun = process.argv.includes('--dry-run');

async function run() {
    await sequelize.authenticate();
    console.log('Connecté à la base de données.\n');

    // Trouver la première année (la plus ancienne)
    const [firstYear] = await sequelize.query(
        `SELECT id, year_label, start_date FROM academic_years ORDER BY start_date ASC LIMIT 1`,
        { type: QueryTypes.SELECT }
    );

    if (!firstYear) {
        console.error('Aucune année académique trouvée. Créez-en une d\'abord.');
        process.exit(1);
    }

    console.log(`Année cible : ${firstYear.year_label} (${firstYear.id})\n`);

    // Compter les enregistrements orphelins
    const [{ count: ctCount }] = await sequelize.query(
        `SELECT COUNT(*) as count FROM course_teachers WHERE academic_year_id IS NULL`,
        { type: QueryTypes.SELECT }
    );
    const [{ count: actCount }] = await sequelize.query(
        `SELECT COUNT(*) as count FROM activities WHERE academic_year_id IS NULL`,
        { type: QueryTypes.SELECT }
    );

    console.log(`course_teachers sans année : ${ctCount}`);
    console.log(`activities sans année     : ${actCount}`);
    console.log('');

    if (dryRun) {
        console.log('Mode --dry-run : aucune modification effectuée.');
        process.exit(0);
    }

    if (Number(ctCount) === 0 && Number(actCount) === 0) {
        console.log('Aucun enregistrement orphelin. Rien à faire.');
        process.exit(0);
    }

    // Mettre à jour
    const [, ctResult] = await sequelize.query(
        `UPDATE course_teachers SET academic_year_id = :yearId WHERE academic_year_id IS NULL`,
        { replacements: { yearId: firstYear.id }, type: QueryTypes.UPDATE }
    );
    const [, actResult] = await sequelize.query(
        `UPDATE activities SET academic_year_id = :yearId WHERE academic_year_id IS NULL`,
        { replacements: { yearId: firstYear.id }, type: QueryTypes.UPDATE }
    );

    console.log(`course_teachers mis à jour : ${ctResult}`);
    console.log(`activities mises à jour    : ${actResult}`);
    console.log(`\nMigration terminée. Toutes les données historiques sont maintenant sous "${firstYear.year_label}".`);

    await sequelize.close();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
