import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthorsModule } from './modules/authors/authors.module';
import { BooksModule } from './modules/books/books.module';
import { UsersModule } from './modules/users/users.module';
import { GenresModule } from './modules/genres/genres.module';
import { SeriesModule } from './modules/series/series.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { UserBookListModule } from './modules/user-book-list/user-book-list.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AuthorsModule,
    BooksModule,
    UsersModule,
    GenresModule,
    SeriesModule,
    ReviewsModule,
    UserBookListModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
