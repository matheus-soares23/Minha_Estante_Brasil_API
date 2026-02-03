import { Module } from '@nestjs/common';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { PrismaSeriesRepository } from '../../repositories/prisma/prisma-series.repository';
import { SERIES_REPOSITORY } from '../../repositories/tokens';

@Module({
  controllers: [SeriesController],
  providers: [
    SeriesService,
    {
      provide: SERIES_REPOSITORY,
      useClass: PrismaSeriesRepository,
    },
  ],
  exports: [SeriesService],
})
export class SeriesModule {}
