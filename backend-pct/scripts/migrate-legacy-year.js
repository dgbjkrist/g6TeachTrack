// scripts/migrate-legacy-year.js
import { Sequelize, QueryTypes } from 'sequelize';
import 'dotenv/config';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
    }
});

async function run() {
    await sequelize.authenticate();

    const [firstYear] = await sequelize.query(
        `SELECT id FROM academic_years ORDER BY start_date ASC LIMIT 1`,
        { type: QueryTypes.SELECT }
    );

    if (!firstYear) {
        console.log('No academic year, skipping');
        return;
    }

    await sequelize.query(`
        UPDATE course_teachers
        SET academic_year_id = COALESCE(academic_year_id, :id)
    `, { replacements: { id: firstYear.id } });

    await sequelize.query(`
        UPDATE activities
        SET academic_year_id = COALESCE(academic_year_id, :id)
    `, { replacements: { id: firstYear.id } });

    console.log('✔ legacy fix done');
    await sequelize.close();
}

run();