import { IsString, IsOptional, MaxLength, IsDateString } from 'class-validator';

export class CreateAuthorDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsDateString()
  deathDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  image?: string;
}
