import { Module } from '@nestjs/common';
import { BookSuggestionsService } from './book-suggestions.service';
import { BookSuggestionsController } from './book-suggestions.controller';
import { PrismaBookSuggestionRepository } from '../../repositories/prisma/prisma-book-suggestion.repository';
import { BOOK_SUGGESTION_REPOSITORY } from '../../repositories/tokens';

@Module({
  controllers: [BookSuggestionsController],
  providers: [
    BookSuggestionsService,
    {
      provide: BOOK_SUGGESTION_REPOSITORY,
      useClass: PrismaBookSuggestionRepository,
    },
  ],
  exports: [BookSuggestionsService],
})
export class BookSuggestionsModule {}
