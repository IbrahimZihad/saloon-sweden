import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import type { StringValue } from 'ms';
import { Staff, User } from '../database/models';
import { MailService } from '../notifications/mail.service';
import { AuthUser } from './decorators/current-user.decorator';
import { ChangePasswordDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';

export interface LoginResult {
  token: string;
  user: AuthUser;
}

const staffInclude = { model: Staff, as: 'staffMember', attributes: ['id'] };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await User.findOne({
      where: { email: dto.email.toLowerCase() },
      include: [staffInclude],
    });
    // Uniform error for unknown email / bad password / inactive account.
    const invalid = new UnauthorizedException('Invalid email or password');
    if (!user || !user.active) throw invalid;

    const valid = await compare(dto.password, user.passwordHash);
    if (!valid) throw invalid;

    const token = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') ?? '1d') as StringValue,
      },
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        staffId: user.staffMember?.id,
      },
    };
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await User.findByPk(userId, { include: [staffInclude] });
    if (!user || !user.active) throw new UnauthorizedException();
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      staffId: user.staffMember?.id,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundException();
    const valid = await compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    await user.update({
      passwordHash: await hash(dto.newPassword, 12),
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  /**
   * Creates a single-use reset token. The response is always generic so the
   * endpoint cannot be used to enumerate accounts. When email is configured
   * the link is sent to the user; otherwise it is written to the server log
   * so an administrator can deliver it manually.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    const message = 'If the account exists, a password reset link has been sent.';
    if (!user || !user.active) return { message };

    const token = randomBytes(32).toString('hex');
    await user.update({
      passwordResetToken: token,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const link = `${frontendUrl}/admin/reset-password?token=${token}`;

    if (this.mail.isConfigured()) {
      try {
        await this.mail.sendMail(
          user.email,
          'Återställ ditt lösenord',
          `<p>Hej ${user.name},</p><p>Klicka på länken för att återställa ditt lösenord (giltig i 1 timme):</p><p><a href="${link}">${link}</a></p><p>Om du inte begärt detta kan du bortse från meddelandet.</p>`,
        );
      } catch (error) {
        this.logger.error(`Password reset email failed for ${user.email}`, error as Error);
        this.logger.warn(`Password reset link (manual delivery): ${link}`);
      }
    } else {
      this.logger.warn(`Email not configured. Password reset link for ${user.email}: ${link}`);
    }
    return { message };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await User.findOne({ where: { passwordResetToken: dto.token } });
    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires.getTime() < Date.now()
    ) {
      throw new BadRequestException('Reset link is invalid or has expired');
    }
    await user.update({
      passwordHash: await hash(dto.newPassword, 12),
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }
}
