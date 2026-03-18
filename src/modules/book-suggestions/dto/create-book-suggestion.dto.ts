import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  IsEnum,
  IsDateString,
  IsUrl,
  Min,
} from 'class-validator';
import { BookType } from '@prisma/client';

export class CreateBookSuggestionDto {
  @IsInt()
  userId: number;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsInt()
  genreId: number;

  @IsEnum(BookType)
  type: BookType;

  @IsOptional()
  @IsDateString()
  publicationDate?: string;

  @IsOptional()
  @IsString()
  synopsis?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(1024)
  coverImage?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  pages?: number;

  @IsString()
  authors: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  seriesName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  seriesVolumes?: number;
}
