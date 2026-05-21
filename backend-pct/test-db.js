import sequelize from './src/config/database.js';

try {
    await sequelize.authenticate();
    console.log('Connexion réussie à PostgreSQL (Neon)');
    process.exit(0);
} catch (error) {
    console.error('Erreur de connexion :', error.message);
    process.exit(1);
}