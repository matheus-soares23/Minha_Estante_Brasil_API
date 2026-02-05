import { Module } from '@nestjs/common';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';
import { AUTHOR_REPOSITORY } from '../../repositories/tokens';
import { PrismaAuthorRepository } from '../../repositories/prisma';

@Module({
  controllers: [AuthorsController],
  providers: [
    AuthorsService,
    {
      provide: AUTHOR_REPOSITORY,
      useClass: PrismaAuthorRepository,
    },
  ],
  exports: [AuthorsService],
})
export class AuthorsModule {}
