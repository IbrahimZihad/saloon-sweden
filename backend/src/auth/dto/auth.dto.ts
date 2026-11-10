import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@salon.se' })
  @IsEmail()
  @MaxLength(190)
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(190)
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(16)
  @MaxLength(190)
  token!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  newPassword!: string;
}