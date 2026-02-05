import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  MinLength,
  IsEnum,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @MaxLength(100)
  @MinLength(3)
  username: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  profileImage?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
