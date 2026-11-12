import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {

  @IsEmail()
  @MaxLength(190)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class ForgotPasswordDto {

  @IsEmail()
  @MaxLength(190)
  email!: string;
}

export class ResetPasswordDto {

  @IsString()
  @MinLength(16)
  @MaxLength(190)
  token!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  newPassword!: string;
}

export class ChangePasswordDto {

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  newPassword!: string;
}