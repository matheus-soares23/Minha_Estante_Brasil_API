import {
  IsString,
  IsOptional,
  MaxLength,
  IsDateString,
  IsInt,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookStatus, BookType } from '@prisma/client';

class BookAuthorInput {
  @IsInt()
  authorId: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  role?: string;
}

export class CreateBookDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalTitle?: string;

  @IsOptional()
  @IsString()
  synopsis?: string;

  @IsOptional()
  @IsDateString()
  publicationDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  coverImage?: string;

  @IsOptional()
  @IsInt()
  pages?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  isbn10?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  isbn13?: string;

  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;

  @IsOptional()
  @IsEnum(BookType)
  type?: BookType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookAuthorInput)
  authors?: BookAuthorInput[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  genreIds?: number[];
}
