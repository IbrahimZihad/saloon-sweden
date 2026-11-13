import { existsSync, readFileSync } from 'fs';
import { isAbsolute, resolve } from 'path';

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

const TRUTHY = new Set(['1', 'true', 'require', 'required']);

/** Modes that enable TLS but do not verify the server certificate. */
const ENCRYPT_ONLY_MODES = new Set(['accept', 'noverify', 'prefer', 'preferred', 'require', 'required']);

/** Modes that enable TLS and verify the server certificate. */
const VERIFY_MODES = new Set(['verify-ca', 'verify-identity', 'strict', 'verify-full']);

/** Modes that explicitly disable TLS. */
const DISABLE_MODES = new Set(['0', 'false', 'disable', 'disabled', 'off']);

/**
 * Resolves a certificate path from the connection URL. Aiven and other hosted
 * providers emit relative paths such as `ssl-ca=certs/ca.pem`, which are
 * resolved against the backend package root as well as the process cwd, so the
 * same URL works whether the app is started from `backend/` or the repo root.
 */
function resolveCertPath(path: string): string {
  if (isAbsolute(path)) return path;

  const candidates = [
    resolve(process.cwd(), path),
    // src/database -> backend, and dist/database -> backend.
    resolve(__dirname, '..', '..', path),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

/** Certificate supplied as inline PEM through an environment variable. */
function certificateFromEnv(): Buffer | undefined {
  const pem = process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n').trim();
  return pem ? Buffer.from(pem) : undefined;
}

/**
 * Parses a MySQL connection URL, accepting the TLS query parameter spellings
 * used by the common MySQL clients and providers:
 *
 * - Prisma:        `sslaccept`, `sslcert`, `sslmode`, `ssl`
 * - MySQL Connector/J & Aiven: `ssl-mode`, `ssl-ca`
 *
 * The CA certificate may also be supplied as PEM text in `DATABASE_CA_CERT`,
 * which is convenient on hosts where committing a certificate file is not
 * possible (Render, Docker secrets, etc.).
 *
 * `ssl-mode=REQUIRED` encrypts without verifying the CA, while `VERIFY_CA` and
 * `VERIFY_IDENTITY` verify it. `DISABLED` turns TLS off.
 */
export function parseDatabaseUrl(rawUrl: string): ParsedDatabaseUrl {
  const url = new URL(rawUrl);
  if (url.protocol !== 'mysql:') {
    throw new Error('DATABASE_URL must be a MySQL connection string (mysql://...)');
  }

  const params = url.searchParams;
  const certPath = params.get('sslcert') ?? params.get('ssl-ca') ?? params.get('sslca') ?? undefined;
  // Normalise `verify_ca` and `verify-identity` to a single spelling.
  const mode = (params.get('sslaccept') ?? params.get('sslmode') ?? params.get('ssl-mode') ?? '')
    .toLowerCase()
    .replace(/_/g, '-');
  const sslFlag = (params.get('ssl') ?? '').toLowerCase();
  const caFromEnv = certificateFromEnv();

  const disabled = DISABLE_MODES.has(mode) || DISABLE_MODES.has(sslFlag);
  // The inline CA only augments an explicit TLS request; it never turns TLS on
  // by itself, so unrelated connections (e.g. the local test database) are not
  // accidentally forced onto TLS.
  const wantsSsl =
    !disabled &&
    (Boolean(certPath) ||
      VERIFY_MODES.has(mode) ||
      ENCRYPT_ONLY_MODES.has(mode) ||
      TRUTHY.has(sslFlag));

  let ssl: SslOptions | undefined;
  if (wantsSsl) {
    let ca: Buffer | undefined;
    if (certPath) {
      const resolved = resolveCertPath(certPath);
      if (!existsSync(resolved)) {
        throw new Error(
          `DATABASE_URL points to a CA certificate that does not exist: ${certPath} ` +
            `(resolved to ${resolved}). Download the CA certificate from your MySQL ` +
            'provider and place it there, or supply the PEM text in DATABASE_CA_CERT.',
        );
      }
      ca = readFileSync(resolved);
    } else if (caFromEnv) {
      ca = caFromEnv;
    }

    const rejectUnauthorized = VERIFY_MODES.has(mode)
      ? true
      : ENCRYPT_ONLY_MODES.has(mode)
        ? false
        : !disabled;

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
