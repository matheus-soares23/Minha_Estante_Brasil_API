import { Review } from '@prisma/client';

export interface IReviewRepository {
  create(data: {
    userId: number;
    bookId: number;
    rating?: number;
    title?: string;
    content?: string;
  }): Promise<Review>;

  findAll(): Promise<Review[]>;

  findOne(id: number): Promise<Review | null>;

  findByBook(bookId: number): Promise<Review[]>;

  findByUser(userId: number): Promise<Review[]>;

  update(
    id: number,
    data: {
      rating?: number;
      title?: string;
      content?: string;
    },
  ): Promise<Review>;

  delete(id: number): Promise<void>;
}
