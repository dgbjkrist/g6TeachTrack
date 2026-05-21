import { Sequelize } from 'sequelize';
import { requireEnv } from './loadEnv.js';

const databaseUrl = requireEnv('DATABASE_URL');
const isLocal = !databaseUrl.includes('neon') && !databaseUrl.includes('ssl');

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: isLocal ? {} : {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

export default sequelize;