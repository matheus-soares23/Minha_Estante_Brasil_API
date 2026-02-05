import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateSeriesDto, UpdateSeriesDto } from './dto';
import { ISeriesRepository } from '../../repositories/interfaces';
import { SERIES_REPOSITORY } from '../../repositories/tokens';

@Injectable()
export class SeriesService {
  constructor(
    @Inject(SERIES_REPOSITORY)
    private readonly seriesRepository: ISeriesRepository,
  ) {}

  async create(createSeriesDto: CreateSeriesDto) {
    return this.seriesRepository.create({
      name: createSeriesDto.name,
      description: createSeriesDto.description,
      slug: createSeriesDto.slug,
    });
  }

  async findAll() {
    return this.seriesRepository.findAll();
  }

  async findOne(id: number) {
    const series = await this.seriesRepository.findOne(id);

    if (!series) {
      throw new NotFoundException(`Series with ID ${id} not found`);
    }

    return series;
  }

  async update(id: number, updateSeriesDto: UpdateSeriesDto) {
    await this.findOne(id);

    return this.seriesRepository.update(id, {
      name: updateSeriesDto.name,
      description: updateSeriesDto.description,
      slug: updateSeriesDto.slug,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.seriesRepository.delete(id);
  }
}
