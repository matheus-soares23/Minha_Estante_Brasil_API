import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAuthorDto, UpdateAuthorDto } from './dto';

@Injectable()
export class AuthorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAuthorDto: CreateAuthorDto) {
    return this.prisma.author.create({
      data: {
        name: createAuthorDto.name,
        biography: createAuthorDto.biography,
        birthDate: createAuthorDto.birthDate
          ? new Date(createAuthorDto.birthDate)
          : null,
        deathDate: createAuthorDto.deathDate
          ? new Date(createAuthorDto.deathDate)
          : null,
        image: createAuthorDto.image,
      },
    });
  }

  async findAll() {
    return this.prisma.author.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const author = await this.prisma.author.findUnique({
      where: { id },
      include: {
        books: {
          include: {
            book: true,
          },
        },
      },
    });

    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }

    return author;
  }

  async update(id: number, updateAuthorDto: UpdateAuthorDto) {
    await this.findOne(id);

    return this.prisma.author.update({
      where: { id },
      data: {
        name: updateAuthorDto.name,
        biography: updateAuthorDto.biography,
        birthDate: updateAuthorDto.birthDate
          ? new Date(updateAuthorDto.birthDate)
          : undefined,
        deathDate: updateAuthorDto.deathDate
          ? new Date(updateAuthorDto.deathDate)
          : undefined,
        image: updateAuthorDto.image,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.author.delete({
      where: { id },
    });
  }
}
