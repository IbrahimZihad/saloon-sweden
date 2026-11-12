import { config } from 'dotenv';
import { assertIsolatedTestDatabase } from './test-db-url';

config({ path: '.env' });

// Integration tests must never touch the development database.
if (process.env.TEST_DATABASE_URL) {
  assertIsolatedTestDatabase(process.env.TEST_DATABASE_URL, process.env.DATABASE_URL);
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
process.env.NODE_ENV = 'test';
