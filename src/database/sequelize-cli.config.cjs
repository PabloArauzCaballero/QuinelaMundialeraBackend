require('dotenv').config();

module.exports = {
  development: {
    dialect: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    database: process.env.DATABASE_NAME || 'quiniela_mundial_2026',
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    logging: process.env.DATABASE_LOGGING === 'true',
    dialectOptions: process.env.DATABASE_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : undefined
  },
  test: {
    dialect: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    database: process.env.DATABASE_NAME || 'quiniela_mundial_2026_test',
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    logging: false
  },
  production: {
    dialect: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 5432),
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    logging: false,
    dialectOptions: process.env.DATABASE_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : undefined
  }
};
