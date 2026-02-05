import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IAuthorRepository,
  CreateAuthorData,
  UpdateAuthorData,
  Author,
  AuthorWithBooks,
} from '../interfaces';

@Injectable()
export class PrismaAuthorRepository implements IAuthorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAuthorData): Promise<Author> {
    return this.prisma.author.create({
      data: {
        name: data.name,
        biography: data.biography,
        birthDate: data.birthDate,
        deathDate: data.deathDate,
        image: data.image,
      },
    });
  }

  async findAll(): Promise<Author[]> {
    return this.prisma.author.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number): Promise<AuthorWithBooks | null> {
    return this.prisma.author.findUnique({
      where: { id },
      include: {
        books: {
          include: {
            book: true,
          },
        },
      },
    });
  }

  async update(id: number, data: UpdateAuthorData): Promise<Author> {
    return this.prisma.author.update({
      where: { id },
      data: {
        name: data.name,
        biography: data.biography,
        birthDate: data.birthDate,
        deathDate: data.deathDate,
        image: data.image,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.author.delete({
      where: { id },
    });
  }
}
