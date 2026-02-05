import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateGenreDto, UpdateGenreDto } from './dto';
import { IGenreRepository } from '../../repositories/interfaces';
import { GENRE_REPOSITORY } from '../../repositories/tokens';

@Injectable()
export class GenresService {
  constructor(
    @Inject(GENRE_REPOSITORY)
    private readonly genreRepository: IGenreRepository,
  ) {}

  async create(createGenreDto: CreateGenreDto) {
    return this.genreRepository.create({
      name: createGenreDto.name,
      description: createGenreDto.description,
      slug: createGenreDto.slug,
    });
  }

  async findAll() {
    return this.genreRepository.findAll();
  }

  async findOne(id: number) {
    const genre = await this.genreRepository.findOne(id);

    if (!genre) {
      throw new NotFoundException(`Genre with ID ${id} not found`);
    }

    return genre;
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    await this.findOne(id);

    return this.genreRepository.update(id, {
      name: updateGenreDto.name,
      description: updateGenreDto.description,
      slug: updateGenreDto.slug,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.genreRepository.delete(id);
  }
}
