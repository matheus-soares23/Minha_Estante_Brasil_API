import { Genre } from '@prisma/client';

export interface IGenreRepository {
  create(data: {
    name: string;
    description?: string;
    slug?: string;
  }): Promise<Genre>;

  findAll(): Promise<Genre[]>;

  findOne(id: number): Promise<Genre | null>;

  findBySlug(slug: string): Promise<Genre | null>;

  update(
    id: number,
    data: {
      name?: string;
      description?: string;
      slug?: string;
    },
  ): Promise<Genre>;

  delete(id: number): Promise<void>;
}
