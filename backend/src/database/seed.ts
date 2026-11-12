import 'reflect-metadata';
import { config } from 'dotenv';
import { createSequelize } from './sequelize.config';
import { logSeedDemoState, logSeedStart, seedAll } from './seeders';

/**
 * Idempotent database seed. Safe to run on every deploy: existing records are
 * never overwritten (in particular, an existing admin password is preserved).
 *
 * Set `SEED_DEMO=true` to also add fictional customers and appointments.
 */
async function main(): Promise<void> {
  config();

  const sequelize = createSequelize();

  try {
    await sequelize.authenticate();
    logSeedStart();
    await seedAll();
    logSeedDemoState();
    console.log('[seed] Done.');
  } finally {
    await sequelize.close();
  }
}

main().catch((error: unknown) => {
  console.error('[seed] Failed:', error);
  process.exitCode = 1;
});
