import { createSequelize } from '../src/database/sequelize.config';
import type { Sequelize } from 'sequelize-typescript';
import { seedAll as runSeedAll } from '../src/database/seeders';

// setup-env.ts points DATABASE_URL at TEST_DATABASE_URL before this module
// loads, so this instance only ever touches the isolated test database.
export const sequelize: Sequelize = createSequelize();

/**
 * Drops and recreates the schema from the Sequelize models. Running this before
 * each suite doubles as a schema-definition check: every model must be able to
 * create its table and foreign keys cleanly.
 */
export async function resetDatabase(): Promise<void> {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
}

/** Runs the production seeders (no demo data) against the test database. */
export async function seedAll(): Promise<void> {
  await runSeedAll();
}

/** Closes the shared connection. Safe to call when it is already closed. */
export async function closeDatabase(): Promise<void> {
  try {
    await sequelize.close();
  } catch {
    // The Express app may already have closed the shared instance in afterAll.
  }
}
