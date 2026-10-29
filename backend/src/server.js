import { createApp } from './app.js';
import { config } from './config/index.js';
import { closeDatabase, getDatabase } from './db/index.js';

const db = getDatabase();
const app = createApp({ db });

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`PlanWars AI Backend running on port ${config.port} (${config.env})`);
});

// Graceful shutdown
function handleShutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
