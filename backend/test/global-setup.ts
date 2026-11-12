import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { parseDatabaseUrl } from '../src/database/url.util';

/**
 * Runs once before the whole suite: creates the isolated test database if it
 * does not exist. The schema itself is recreated per suite with
 * `sequelize.sync({ force: true })` so every test file starts from a clean state.
 *
 * The development database is never touched.
 */
export default async function globalSetup(): Promise<void> {
  config({ path: '.env' });

  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error('TEST_DATABASE_URL must be set (see .env) to run the test suite.');
  }

  const parsed = parseDatabaseUrl(testUrl);
  const connection = await mysql.createConnection({
    host: parsed.host,
    port: parsed.port,
    user: parsed.username,
    password: parsed.password,
    ...(parsed.ssl ? { ssl: parsed.ssl } : {}),
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${parsed.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await connection.end();
  }
}
