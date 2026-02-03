import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateSeriesDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;
}
