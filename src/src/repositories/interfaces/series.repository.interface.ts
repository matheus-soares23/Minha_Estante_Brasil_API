import { Series } from '@prisma/client';

export interface ISeriesRepository {
  create(data: {
    name: string;
    description?: string;
    slug?: string;
  }): Promise<Series>;

  findAll(): Promise<Series[]>;

  findOne(id: number): Promise<Series | null>;

  findBySlug(slug: string): Promise<Series | null>;

  update(
    id: number,
    data: {
      name?: string;
      description?: string;
      slug?: string;
    },
  ): Promise<Series>;

  delete(id: number): Promise<void>;
}
