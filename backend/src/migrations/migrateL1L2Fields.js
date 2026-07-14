const sequelize = require('../config/sequelize');

async function run() {
  try {
    await sequelize.authenticate();
    console.log("Connected to db");
    await sequelize.query(`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS l1_l2_date DATE, ADD COLUMN IF NOT EXISTS l1_l2_time VARCHAR(255);`);
    console.log("Columns added successfully");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
