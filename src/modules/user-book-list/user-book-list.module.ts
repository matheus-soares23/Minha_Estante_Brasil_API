import { Module } from '@nestjs/common';
import { UserBookListService } from './user-book-list.service';
import { UserBookListController } from './user-book-list.controller';
import { PrismaUserBookListRepository } from '../../repositories/prisma/prisma-user-book-list.repository';
import { USER_BOOK_LIST_REPOSITORY } from '../../repositories/tokens';
import { BooksModule } from '../books/books.module';

@Module({
  imports: [BooksModule],
  controllers: [UserBookListController],
  providers: [
    UserBookListService,
    {
      provide: USER_BOOK_LIST_REPOSITORY,
      useClass: PrismaUserBookListRepository,
    },
  ],
  exports: [UserBookListService],
})
export class UserBookListModule {}
