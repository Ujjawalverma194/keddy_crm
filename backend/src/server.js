const app = require('./app');
const config = require('./config');
const { connectDB } = require('./config/db');
const fs = require('fs');
const path = require('path');

async function start() {
  if (!fs.existsSync(config.mediaRoot)) {
    fs.mkdirSync(config.mediaRoot, { recursive: true });
  }

  await connectDB();

  app.listen(config.port, () => {
    console.log(`Keddy CRM API running at http://localhost:${config.port}`);
    console.log(`Media served at http://localhost:${config.port}${config.mediaUrl}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
