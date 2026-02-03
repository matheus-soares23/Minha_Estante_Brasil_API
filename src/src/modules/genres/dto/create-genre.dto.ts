import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateGenreDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;
}
