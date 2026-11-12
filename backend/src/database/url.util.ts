import { existsSync, readFileSync } from 'fs';

export interface SslOptions {
  ca?: Buffer;
  rejectUnauthorized: boolean;
}

export interface ParsedDatabaseUrl {
  username: string;
  password: string;
  host: string;
  port: number;
  database: string;
  ssl?: SslOptions;
}

const TRUTHY = new Set(['1', 'true', 'require', 'required', 'verify-ca', 'verify-full']);
const DISABLED = new Set(['0', 'false', 'disable', 'disabled']);

/**
 * Parses a MySQL connection URL, including the Prisma-style TLS query
 * parameters (`sslaccept`, `sslcert`, `sslmode`, `ssl`) so existing
 * `DATABASE_URL` values keep working unchanged.
 */
export function parseDatabaseUrl(rawUrl: string): ParsedDatabaseUrl {
  const url = new URL(rawUrl);
  if (url.protocol !== 'mysql:') {
    throw new Error('DATABASE_URL must be a MySQL connection string (mysql://...)');
  }

  const params = url.searchParams;
  const certPath = params.get('sslcert');
  const sslMode = (params.get('sslaccept') ?? params.get('sslmode') ?? '').toLowerCase();
  const sslFlag = (params.get('ssl') ?? '').toLowerCase();

  const wantsSsl =
    Boolean(certPath) || TRUTHY.has(sslMode) || TRUTHY.has(sslFlag) || sslMode === 'prefer';

  let ssl: SslOptions | undefined;
  if (wantsSsl) {
    let ca: Buffer | undefined;
    if (certPath) {
      if (!existsSync(certPath)) {
        throw new Error(
          `DATABASE_URL points to a CA certificate that does not exist: ${certPath}. ` +
            'Download the CA certificate from your MySQL provider and place it at that path.',
        );
      }
      ca = readFileSync(certPath);
    }

    // `sslaccept=accept` / `sslmode=require` encrypt without verifying the
    // certificate. Anything else (including Prisma's `strict`) verifies it.
    const rejectUnauthorized = !(
      sslMode === 'accept' ||
      sslMode === 'noverify' ||
      DISABLED.has(sslMode) ||
      DISABLED.has(sslFlag)
    );

    ssl = { rejectUnauthorized, ...(ca ? { ca } : {}) };
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!database) {
    throw new Error('DATABASE_URL must include a database name');
  }

  return {
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    database,
    ...(ssl ? { ssl } : {}),
  };
}
