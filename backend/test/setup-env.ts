import { config } from 'dotenv';

config({ path: '.env' });

// Integration tests must never touch the development database.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
// A cloud CA from .env must never be applied to the local test database.
delete process.env.DATABASE_CA_CERT;
process.env.NODE_ENV = 'test';
