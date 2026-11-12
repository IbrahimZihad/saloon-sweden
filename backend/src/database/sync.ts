import 'reflect-metadata';
import { config } from 'dotenv';
import { createSequelize } from './sequelize.config';

/**
 * Creates any missing tables for the registered models.
 *
 * This is the Sequelize equivalent of the old `prisma migrate deploy`. Existing
 * tables are left untouched, so it is safe to run on every deploy. Set
 * `DB_SYNC_ALTER=true` to also reconcile column/index changes on an existing
 * database (slower, and intended for development/staging rather than
 * production).
 */
async function main(): Promise<void> {
  config();

  const sequelize = createSequelize();
  const alter = (process.env.DB_SYNC_ALTER ?? 'false').toLowerCase() === 'true';

  try {
    await sequelize.authenticate();
    console.log(`[db:sync] Connected to ${sequelize.config.database} — syncing models…`);
    await sequelize.sync(alter ? { alter: true } : undefined);
    console.log(`[db:sync] Schema is up to date${alter ? ' (altered)' : ''}.`);
  } finally {
    await sequelize.close();
  }
}

main().catch((error: unknown) => {
  console.error('[db:sync] Failed:', error);
  process.exitCode = 1;
});
