import { Injectable } from '@nestjs/common';
import { Genre } from '@prisma/client';
import { IGenreRepository } from '../interfaces/genre.repository.interface';

@Injectable()
export class InMemoryGenreRepository implements IGenreRepository {
  private genres: Genre[] = [];
  private currentId = 1;

  async create(data: {
    name: string;
    description?: string;
    slug?: string;
  }): Promise<Genre> {
    const genre: Genre = {
      id: this.currentId++,
      name: data.name,
      description: data.description || null,
      slug: data.slug || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.genres.push(genre);
    return genre;
  }

  async findAll(): Promise<Genre[]> {
    return [...this.genres].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findOne(id: number): Promise<Genre | null> {
    return this.genres.find((genre) => genre.id === id) || null;
  }

  async findBySlug(slug: string): Promise<Genre | null> {
    return this.genres.find((genre) => genre.slug === slug) || null;
  }

  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      slug?: string;
    },
  ): Promise<Genre> {
    const index = this.genres.findIndex((genre) => genre.id === id);

    if (index === -1) {
      throw new Error('Genre not found');
    }

    this.genres[index] = {
      ...this.genres[index],
      ...data,
      updatedAt: new Date(),
    };

    return this.genres[index];
  }

  async delete(id: number): Promise<void> {
    const index = this.genres.findIndex((genre) => genre.id === id);

    if (index === -1) {
      throw new Error('Genre not found');
    }

    this.genres.splice(index, 1);
  }
}
