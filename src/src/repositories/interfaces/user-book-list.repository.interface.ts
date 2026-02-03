import { UserBookList, ListStatus } from '@prisma/client';

export interface IUserBookListRepository {
  create(data: {
    userId: number;
    bookId: number;
    status?: ListStatus;
    rating?: number;
    progress?: number;
    startDate?: Date;
    finishDate?: Date;
    notes?: string;
  }): Promise<UserBookList>;

  findAll(): Promise<UserBookList[]>;

  findOne(id: number): Promise<UserBookList | null>;

  findByUser(userId: number): Promise<UserBookList[]>;

  findByUserAndBook(
    userId: number,
    bookId: number,
  ): Promise<UserBookList | null>;

  update(
    id: number,
    data: {
      status?: ListStatus;
      rating?: number;
      progress?: number;
      startDate?: Date;
      finishDate?: Date;
      notes?: string;
    },
  ): Promise<UserBookList>;

  delete(id: number): Promise<void>;
}
