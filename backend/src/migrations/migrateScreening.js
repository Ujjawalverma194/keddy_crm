const sequelize = require('../config/sequelize');

async function run() {
  try {
    await sequelize.authenticate();
    console.log("Connected to db");
    const [results, metadata] = await sequelize.query(`UPDATE candidates SET main_status = 'INTERNAL SCREENING' WHERE main_status = 'SCREENING'`);
    console.log("Updated rows:", metadata.rowCount);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
