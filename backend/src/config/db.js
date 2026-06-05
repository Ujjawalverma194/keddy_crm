const sequelize = require('./sequelize');
const { syncDatabase } = require('../models/sequelize/init');
const config = require('./index');

async function connectDB() {
  await sequelize.authenticate();
  console.log('PostgreSQL connected');

  if (config.syncDb) {
    await syncDatabase();
    console.log('Database schema synced');
  }
}

module.exports = { connectDB, sequelize };
