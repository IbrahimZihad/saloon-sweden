import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, relative } from 'path';
import { parseDatabaseUrl } from './url.util';

describe('parseDatabaseUrl', () => {
  let certDir: string;
  let certPath: string;

  beforeAll(() => {
    certDir = mkdtempSync(join(tmpdir(), 'salon-url-'));
    certPath = join(certDir, 'ca.pem');
    writeFileSync(certPath, '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----\n');
  });

  afterAll(() => {
    rmSync(certDir, { recursive: true, force: true });
  });

  it('parses host, port, credentials and database', () => {
    const parsed = parseDatabaseUrl('mysql://user:p%40ss@db.example.com:17082/salon');
    expect(parsed).toMatchObject({
      username: 'user',
      password: 'p@ss',
      host: 'db.example.com',
      port: 17082,
      database: 'salon',
    });
    expect(parsed.ssl).toBeUndefined();
  });

  it('reads the Aiven/Connector-J ssl-mode and ssl-ca parameters', () => {
    const url = `mysql://avnadmin:secret@db.example.com:17082/defaultdb?ssl-mode=REQUIRED&ssl-ca=${encodeURIComponent(certPath)}`;
    const parsed = parseDatabaseUrl(url);
    expect(parsed.ssl?.rejectUnauthorized).toBe(false);
    expect(parsed.ssl?.ca?.toString()).toContain('BEGIN CERTIFICATE');
  });

  it('verifies the certificate for VERIFY_CA / VERIFY_IDENTITY', () => {
    for (const mode of ['VERIFY_CA', 'VERIFY_IDENTITY', 'verify_ca']) {
      const parsed = parseDatabaseUrl(
        `mysql://u:p@db.example.com:3306/salon?ssl-mode=${mode}&ssl-ca=${encodeURIComponent(certPath)}`,
      );
      expect(parsed.ssl?.rejectUnauthorized).toBe(true);
    }
  });

  it('still accepts the Prisma-style parameters', () => {
    const strict = parseDatabaseUrl(
      `mysql://u:p@db.example.com:3306/salon?sslaccept=strict&sslcert=${encodeURIComponent(certPath)}`,
    );
    expect(strict.ssl?.rejectUnauthorized).toBe(true);

    const accept = parseDatabaseUrl('mysql://u:p@db.example.com:3306/salon?sslaccept=accept');
    expect(accept.ssl?.rejectUnauthorized).toBe(false);
    expect(accept.ssl?.ca).toBeUndefined();
  });

  it('disables TLS when requested', () => {
    expect(parseDatabaseUrl('mysql://u:p@db.example.com:3306/salon?ssl-mode=DISABLED').ssl).toBeUndefined();
    expect(parseDatabaseUrl('mysql://u:p@db.example.com:3306/salon?ssl=false').ssl).toBeUndefined();
  });

  it('resolves a relative certificate path from the working directory', () => {
    const relativePath = relative(process.cwd(), certPath);
    const parsed = parseDatabaseUrl(
      `mysql://u:p@db.example.com:3306/salon?ssl-mode=REQUIRED&ssl-ca=${encodeURIComponent(relativePath)}`,
    );
    expect(parsed.ssl?.ca?.toString()).toContain('BEGIN CERTIFICATE');
  });

  it('fails clearly when the certificate is missing', () => {
    expect(() =>
      parseDatabaseUrl('mysql://u:p@db.example.com:3306/salon?ssl-mode=REQUIRED&ssl-ca=./nope/ca.pem'),
    ).toThrow(/CA certificate that does not exist/);
  });

  it('rejects non-MySQL URLs', () => {
    expect(() => parseDatabaseUrl('postgres://u:p@db.example.com/salon')).toThrow(/must be a MySQL/);
  });
});

describe('DATABASE_CA_CERT', () => {
  const original = process.env.DATABASE_CA_CERT;
  const pem = '-----BEGIN CERTIFICATE-----\ninline\n-----END CERTIFICATE-----';

  afterEach(() => {
    if (original === undefined) delete process.env.DATABASE_CA_CERT;
    else process.env.DATABASE_CA_CERT = original;
  });

  it('enables verified TLS from inline PEM when the URL requests it', () => {
    process.env.DATABASE_CA_CERT = pem;
    const parsed = parseDatabaseUrl('mysql://u:p@db.example.com:3306/salon?ssl-mode=VERIFY_CA');
    expect(parsed.ssl?.rejectUnauthorized).toBe(true);
    expect(parsed.ssl?.ca?.toString()).toBe(pem);
  });

  it('accepts escaped newlines, as pasted into a hosting dashboard', () => {
    process.env.DATABASE_CA_CERT = pem.replace(/\n/g, '\\n');
    const parsed = parseDatabaseUrl('mysql://u:p@db.example.com:3306/salon?ssl-mode=VERIFY_CA');
    expect(parsed.ssl?.ca?.toString()).toBe(pem);
    expect(parsed.ssl?.rejectUnauthorized).toBe(true);
  });

  it('does not force TLS onto a URL that did not ask for it', () => {
    process.env.DATABASE_CA_CERT = pem;
    const parsed = parseDatabaseUrl('mysql://u:p@localhost:3307/salon_booking_test');
    expect(parsed.ssl).toBeUndefined();
  });
});
