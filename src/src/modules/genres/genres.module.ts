import { Module } from '@nestjs/common';
import { GenresService } from './genres.service';
import { GenresController } from './genres.controller';
import { PrismaGenreRepository } from '../../repositories/prisma/prisma-genre.repository';
import { GENRE_REPOSITORY } from '../../repositories/tokens';

@Module({
  controllers: [GenresController],
  providers: [
    GenresService,
    {
      provide: GENRE_REPOSITORY,
      useClass: PrismaGenreRepository,
    },
  ],
  exports: [GenresService],
})
export class GenresModule {}
