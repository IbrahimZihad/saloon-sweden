import { Sequelize } from 'sequelize-typescript';
import { models } from './models';
import { parseDatabaseUrl } from './url.util';

/**
 * Builds the single application-wide Sequelize instance from `DATABASE_URL`.
 *
 * The Prisma-style TLS query parameters used by hosted MySQL providers
 * (`sslaccept`, `sslcert`) are translated to mysql2 TLS options.
 */
export function createSequelize(): Sequelize {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error('DATABASE_URL must be set');
  }

  const parsed = parseDatabaseUrl(rawUrl);

  return new Sequelize({
    dialect: 'mysql',
    host: parsed.host,
    port: parsed.port,
    username: parsed.username,
    password: parsed.password,
    database: parsed.database,
    models,
    logging: false,
    // Prisma stored all DATETIME values in UTC; keep the same convention.
    timezone: '+00:00',
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    dialectOptions: {
      ...(parsed.ssl ? { ssl: parsed.ssl } : {}),
      supportBigNumbers: true,
      bigNumberStrings: true,
    },
    pool: { max: 10, min: 0, acquire: 30_000, idle: 10_000 },
  });
}
