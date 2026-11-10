import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

/**
 * Runs once before the whole suite: creates the isolated test database (if
 * missing) and applies all version-controlled migrations to it. The development
 * database is never touched.
 */
export default async function globalSetup(): Promise<void> {
  config({ path: '.env' });
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error('TEST_DATABASE_URL must be set (see .env.example) to run the test suite.');
  }

  const url = new URL(testUrl);
  const dbName = url.pathname.slice(1);
  url.pathname = '/mysql';
  const server = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  await server.$executeRawUnsafe(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await server.$disconnect();

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'inherit',
  });
}