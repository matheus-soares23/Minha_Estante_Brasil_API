import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { BOOK_REPOSITORY } from '../../repositories/tokens';
import { PrismaBookRepository } from '../../repositories/prisma';

@Module({
  controllers: [BooksController],
  providers: [
    BooksService,
    {
      provide: BOOK_REPOSITORY,
      useClass: PrismaBookRepository,
    },
  ],
  exports: [BooksService, BOOK_REPOSITORY],
})
export class BooksModule {}
