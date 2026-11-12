import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { assertIsolatedTestDatabase, databaseName } from './test-db-url';

/**
 * Runs once before the whole suite: applies all version-controlled migrations
 * to the isolated test database. The development database is never touched.
 *
 * Hosted MySQL providers such as Aiven usually require the test database to be
 * created in their console first, and the admin user may not be able to access
 * the `mysql` system schema. We therefore connect to the target database
 * directly and only attempt creation as a fallback.
 */
export default async function globalSetup(): Promise<void> {
  config({ path: '.env' });
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error('TEST_DATABASE_URL must be set (see .env.example) to run the test suite.');
  }
  assertIsolatedTestDatabase(testUrl, process.env.DATABASE_URL);

  const dbName = databaseName(testUrl);

  const target = new PrismaClient({ datasources: { db: { url: testUrl } } });
  try {
    await target.$queryRawUnsafe('SELECT 1');
  } catch {
    // The test database does not exist yet. Connect to the application
    // database (or the server's `mysql` database as a fallback) to create it.
    const serverUrl = new URL(testUrl);
    serverUrl.pathname = process.env.DATABASE_URL
      ? `/${databaseName(process.env.DATABASE_URL)}`
      : '/mysql';

    const server = new PrismaClient({ datasources: { db: { url: serverUrl.toString() } } });
    try {
      await server.$executeRawUnsafe(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Could not reach test database "${dbName}" and could not create it automatically: ${message}. ` +
          'Create it in the Aiven console (or your MySQL server) and run the tests again.',
      );
    } finally {
      await server.$disconnect();
    }
  } finally {
    await target.$disconnect();
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'inherit',
  });
}
