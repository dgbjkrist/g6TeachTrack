import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: console.log,
    dialect: 'postgres'
});

async function run() {
    await sequelize.authenticate();
    console.log('Connecté.\n');

    // 1. chercher année (OPTIONNELLE)
    const [firstYear] = await sequelize.query(
        `SELECT id, year_label FROM academic_years ORDER BY start_date ASC LIMIT 1`,
        { type: QueryTypes.SELECT }
    );

    if (firstYear) {
        console.log(`Année trouvée : ${firstYear.year_label}`);

        await sequelize.query(`
            UPDATE course_teachers
            SET academic_year_id = :yearId
            WHERE academic_year_id IS NULL
        `, {
            replacements: { yearId: firstYear.id }
        });

        await sequelize.query(`
            UPDATE activities
            SET academic_year_id = :yearId
            WHERE academic_year_id IS NULL
        `, {
            replacements: { yearId: firstYear.id }
        });

    } else {
        console.log('⚠️ Aucune année académique trouvée → skip update');
    }

    // 2. ces migrations DOIVENT continuer quoi qu’il arrive

    await sequelize.query(`
        ALTER TABLE course_teachers
        ALTER COLUMN academic_year_id SET NOT NULL
    `).catch(err => {
        console.log('⚠️ NOT NULL skipped:', err.message);
    });

    await sequelize.query(`
        ALTER TABLE course_teachers
        DROP CONSTRAINT IF EXISTS course_teachers_pkey
    `).catch(err => {
        console.log('⚠️ DROP PK skipped');
    });

    await sequelize.query(`
        ALTER TABLE course_teachers
        ADD PRIMARY KEY (course_id, teacher_id, academic_year_id)
    `).catch(err => {
        console.log('⚠️ ADD PK skipped');
    });

    console.log('\nMigration terminée (safe mode).');
    await sequelize.close();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});