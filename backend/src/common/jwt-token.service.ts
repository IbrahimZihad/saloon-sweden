import { createHmac, timingSafeEqual } from 'node:crypto';

interface JwtSignOptions {
  secret: string;
  expiresIn?: string;
}

interface JwtVerifyOptions {
  secret: string;
}

interface JwtPayload {
  [key: string]: unknown;
  iat?: number;
  exp?: number;
}

function expirationSeconds(expiresIn: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) throw new Error(`Unsupported JWT expiration value: ${expiresIn}`);
  const amount = Number(match[1]);
  const unitSeconds: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return amount * unitSeconds[match[2]];
}

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signature(input: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(input).digest();
}

export class JwtTokenService {
  constructor(private readonly defaults: JwtSignOptions) {}

  async signAsync(payload: JwtPayload, options: Partial<JwtSignOptions> = {}): Promise<string> {
    const secret = options.secret ?? this.defaults.secret;
    const expiresIn = options.expiresIn ?? this.defaults.expiresIn ?? '1d';
    const issuedAt = Math.floor(Date.now() / 1000);
    const headAndPayload = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
      ...payload,
      iat: issuedAt,
      exp: issuedAt + expirationSeconds(expiresIn),
    })}`;
    return `${headAndPayload}.${signature(headAndPayload, secret).toString('base64url')}`;
  }

  async verifyAsync<T extends JwtPayload>(token: string, options: JwtVerifyOptions): Promise<T> {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT');
    const [headerPart, payloadPart, signaturePart] = parts;
    const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8')) as { alg?: string };
    if (header.alg !== 'HS256') throw new Error('Unsupported JWT algorithm');

    const expected = signature(`${headerPart}.${payloadPart}`, options.secret);
    const supplied = Buffer.from(signaturePart, 'base64url');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      throw new Error('Invalid JWT signature');
    }

    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as T;
    if (typeof payload.exp === 'number' && payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new Error('JWT expired');
    }
    return payload;
  }
}
