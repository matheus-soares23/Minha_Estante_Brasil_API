import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { PrismaReviewRepository } from '../../repositories/prisma/prisma-review.repository';
import { REVIEW_REPOSITORY } from '../../repositories/tokens';
import { BooksModule } from '../books/books.module';

@Module({
  imports: [BooksModule],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    {
      provide: REVIEW_REPOSITORY,
      useClass: PrismaReviewRepository,
    },
  ],
  exports: [ReviewsService],
})
export class ReviewsModule {}
