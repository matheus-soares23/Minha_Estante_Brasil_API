import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateAuthorDto, UpdateAuthorDto } from './dto';
import { IAuthorRepository } from '../../repositories/interfaces';
import { AUTHOR_REPOSITORY } from '../../repositories/tokens';

@Injectable()
export class AuthorsService {
  constructor(
    @Inject(AUTHOR_REPOSITORY)
    private readonly authorRepository: IAuthorRepository,
  ) {}

  async create(createAuthorDto: CreateAuthorDto) {
    return this.authorRepository.create({
      name: createAuthorDto.name,
      biography: createAuthorDto.biography,
      birthDate: createAuthorDto.birthDate
        ? new Date(createAuthorDto.birthDate)
        : undefined,
      deathDate: createAuthorDto.deathDate
        ? new Date(createAuthorDto.deathDate)
        : undefined,
      image: createAuthorDto.image,
    });
  }

  async findAll() {
    return this.authorRepository.findAll();
  }

  async findOne(id: number) {
    const author = await this.authorRepository.findOne(id);

    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }

    return author;
  }

  async update(id: number, updateAuthorDto: UpdateAuthorDto) {
    await this.findOne(id);

    return this.authorRepository.update(id, {
      name: updateAuthorDto.name,
      biography: updateAuthorDto.biography,
      birthDate: updateAuthorDto.birthDate
        ? new Date(updateAuthorDto.birthDate)
        : undefined,
      deathDate: updateAuthorDto.deathDate
        ? new Date(updateAuthorDto.deathDate)
        : undefined,
      image: updateAuthorDto.image,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.authorRepository.delete(id);
  }
}
