import { IsOptional, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum BookSortBy {
  TITLE = 'title',
  RATING = 'rating',
  POPULARITY = 'popularity',
  PUBLICATION_DATE = 'publicationDate',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class FindAllBooksFiltersDto {
  @IsOptional()
  @IsEnum(BookSortBy)
  sortBy?: BookSortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  genreId?: number;
}
