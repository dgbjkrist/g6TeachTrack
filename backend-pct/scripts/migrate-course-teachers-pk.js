/**
 * Migration : change la clé primaire de course_teachers
 * de (course_id, teacher_id) vers (course_id, teacher_id, academic_year_id).
 *
 * Pré-requis : au moins une année académique doit exister.
 * Cette migration :
 *   1. Assigne les enregistrements sans année à la première année (la plus ancienne)
 *   2. Rend academic_year_id NOT NULL
 *   3. Remplace la PK par (course_id, teacher_id, academic_year_id)
 *
 * Usage : node scripts/migrate-course-teachers-pk.js
 */

import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: console.log, dialect: 'postgres' });

async function run() {
    await sequelize.authenticate();
    console.log('Connecté.\n');

    const t = await sequelize.transaction();
    try {
        // 1. Trouver la première année
        const [firstYear] = await sequelize.query(
            `SELECT id, year_label FROM academic_years ORDER BY start_date ASC LIMIT 1`,
            { type: QueryTypes.SELECT, transaction: t }
        );
        if (!firstYear) throw new Error('Aucune année académique — créez-en une d\'abord.');
        console.log(`\nAnnée cible pour les enregistrements orphelins : ${firstYear.year_label}\n`);

        // 2. Assigner les NULL à la première année
        const [, updatedCT] = await sequelize.query(
            `UPDATE course_teachers SET academic_year_id = :yearId WHERE academic_year_id IS NULL`,
            { replacements: { yearId: firstYear.id }, type: QueryTypes.UPDATE, transaction: t }
        );
        const [, updatedAct] = await sequelize.query(
            `UPDATE activities SET academic_year_id = :yearId WHERE academic_year_id IS NULL`,
            { replacements: { yearId: firstYear.id }, type: QueryTypes.UPDATE, transaction: t }
        );
        console.log(`course_teachers mis à jour : ${updatedCT}`);
        console.log(`activities mises à jour    : ${updatedAct}\n`);

        // 3. Rendre academic_year_id NOT NULL dans course_teachers
        await sequelize.query(
            `ALTER TABLE course_teachers ALTER COLUMN academic_year_id SET NOT NULL`,
            { type: QueryTypes.RAW, transaction: t }
        );
        console.log('academic_year_id est maintenant NOT NULL.');

        // 4. Supprimer l'ancienne PK (course_id, teacher_id)
        await sequelize.query(
            `ALTER TABLE course_teachers DROP CONSTRAINT course_teachers_pkey`,
            { type: QueryTypes.RAW, transaction: t }
        );
        console.log('Ancienne PK supprimée.');

        // 5. Nouvelle PK (course_id, teacher_id, academic_year_id)
        await sequelize.query(
            `ALTER TABLE course_teachers ADD PRIMARY KEY (course_id, teacher_id, academic_year_id)`,
            { type: QueryTypes.RAW, transaction: t }
        );
        console.log('Nouvelle PK (course_id, teacher_id, academic_year_id) créée.');

        await t.commit();
        console.log('\nMigration terminée avec succès.');
    } catch (err) {
        await t.rollback();
        console.error('\nErreur — rollback effectué :', err.message);
        process.exit(1);
    }

    await sequelize.close();
}

run().catch((err) => { console.error(err); process.exit(1); });
