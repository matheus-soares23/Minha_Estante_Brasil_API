import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserBookListDto } from './create-user-book-list.dto';

export class UpdateUserBookListDto extends PartialType(
  OmitType(CreateUserBookListDto, ['userId', 'bookId'] as const),
) {}
