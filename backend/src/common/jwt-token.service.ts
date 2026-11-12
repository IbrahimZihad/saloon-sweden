import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

interface JwtSignOptions {
  secret: string;
  expiresIn?: SignOptions['expiresIn'];
}

interface JwtVerifyOptions {
  secret: string;
}

export class JwtTokenService {
  constructor(private readonly defaults: JwtSignOptions) {}

  async signAsync(payload: JwtPayload, options: Partial<JwtSignOptions> = {}): Promise<string> {
    const secret = options.secret ?? this.defaults.secret;
    const expiresIn = options.expiresIn ?? this.defaults.expiresIn ?? '1d';
    return new Promise((resolve, reject) => {
      jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn }, (error, token) => {
        if (error) reject(error);
        else resolve(token);
      });
    });
  }

  async verifyAsync<T extends JwtPayload>(token: string, options: JwtVerifyOptions): Promise<T> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, options.secret, { algorithms: ['HS256'] }, (error, payload) => {
        if (error) reject(error);
        else if (!payload || typeof payload === 'string') reject(new Error('Invalid JWT payload'));
        else resolve(payload as T);
      });
    });
  }
}
