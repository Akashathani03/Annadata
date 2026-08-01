import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

async function start() {
  try {
    await connectDatabase();
    app.listen(env.port, () => {
      console.log(`[server] Annadata backend listening on port ${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  }
}

start();
