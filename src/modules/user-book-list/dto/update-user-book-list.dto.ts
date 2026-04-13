import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserBookListDto } from './create-user-book-list.dto';

export class UpdateUserBookListDto extends PartialType(
  OmitType(CreateUserBookListDto, ['bookId'] as const),
) {}
