import { Injectable } from '@nestjs/common';
import { Genre } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IGenreRepository } from '../interfaces/genre.repository.interface';

@Injectable()
export class PrismaGenreRepository implements IGenreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    description?: string;
    slug?: string;
  }): Promise<Genre> {
    return this.prisma.genre.create({
      data,
    });
  }

  async findAll(): Promise<Genre[]> {
    return this.prisma.genre.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number): Promise<Genre | null> {
    return this.prisma.genre.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<Genre | null> {
    return this.prisma.genre.findUnique({
      where: { slug },
    });
  }

  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      slug?: string;
    },
  ): Promise<Genre> {
    return this.prisma.genre.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.genre.delete({
      where: { id },
    });
  }
}
