import { Injectable } from '@nestjs/common';
import { Series } from '@prisma/client';
import { ISeriesRepository } from '../interfaces/series.repository.interface';

@Injectable()
export class InMemorySeriesRepository implements ISeriesRepository {
  private series: Series[] = [];
  private currentId = 1;

  async create(data: {
    name: string;
    description?: string;
    slug?: string;
  }): Promise<Series> {
    const series: Series = {
      id: this.currentId++,
      name: data.name,
      description: data.description || null,
      slug: data.slug || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.series.push(series);
    return series;
  }

  async findAll(): Promise<Series[]> {
    return [...this.series].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findOne(id: number): Promise<Series | null> {
    return this.series.find((s) => s.id === id) || null;
  }

  async findBySlug(slug: string): Promise<Series | null> {
    return this.series.find((s) => s.slug === slug) || null;
  }

  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      slug?: string;
    },
  ): Promise<Series> {
    const index = this.series.findIndex((s) => s.id === id);

    if (index === -1) {
      throw new Error('Series not found');
    }

    this.series[index] = {
      ...this.series[index],
      ...data,
      updatedAt: new Date(),
    };

    return this.series[index];
  }

  async delete(id: number): Promise<void> {
    const index = this.series.findIndex((s) => s.id === id);

    if (index === -1) {
      throw new Error('Series not found');
    }

    this.series.splice(index, 1);
  }
}
