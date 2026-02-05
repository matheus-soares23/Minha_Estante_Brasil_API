import { Injectable } from '@nestjs/common';
import { Series } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ISeriesRepository } from '../interfaces/series.repository.interface';

@Injectable()
export class PrismaSeriesRepository implements ISeriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    description?: string;
    slug?: string;
  }): Promise<Series> {
    return this.prisma.series.create({
      data,
    });
  }

  async findAll(): Promise<Series[]> {
    return this.prisma.series.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number): Promise<Series | null> {
    return this.prisma.series.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<Series | null> {
    return this.prisma.series.findUnique({
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
  ): Promise<Series> {
    return this.prisma.series.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.series.delete({
      where: { id },
    });
  }
}
