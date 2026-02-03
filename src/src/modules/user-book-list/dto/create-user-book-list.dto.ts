import {
  IsInt,
  IsOptional,
  IsString,
  IsEnum,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ListStatus } from '@prisma/client';

export class CreateUserBookListDto {
  @IsInt()
  userId: number;

  @IsInt()
  bookId: number;

  @IsOptional()
  @IsEnum(ListStatus)
  status?: ListStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  progress?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  finishDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
