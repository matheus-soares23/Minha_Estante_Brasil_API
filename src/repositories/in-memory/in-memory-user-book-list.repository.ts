import { Injectable } from '@nestjs/common';
import { UserBookList, ListStatus } from '@prisma/client';
import { IUserBookListRepository } from '../interfaces/user-book-list.repository.interface';

@Injectable()
export class InMemoryUserBookListRepository implements IUserBookListRepository {
  private userBookLists: UserBookList[] = [];
  private currentId = 1;

  async create(data: {
    userId: number;
    bookId: number;
    status?: ListStatus;
    rating?: number;
    progress?: number;
    startDate?: Date;
    finishDate?: Date;
    notes?: string;
  }): Promise<UserBookList> {
    const userBookList: UserBookList = {
      id: this.currentId++,
      userId: data.userId,
      bookId: data.bookId,
      status: data.status || null,
      rating: data.rating || null,
      progress: data.progress || null,
      startDate: data.startDate || null,
      finishDate: data.finishDate || null,
      notes: data.notes || null,
      updatedAt: new Date(),
    };

    this.userBookLists.push(userBookList);
    return userBookList;
  }

  async findAll(): Promise<UserBookList[]> {
    return [...this.userBookLists].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }

  async findOne(id: number): Promise<UserBookList | null> {
    return this.userBookLists.find((ubl) => ubl.id === id) || null;
  }

  async findByUser(userId: number): Promise<UserBookList[]> {
    return this.userBookLists
      .filter((ubl) => ubl.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async findByUserAndBook(
    userId: number,
    bookId: number,
  ): Promise<UserBookList | null> {
    return (
      this.userBookLists.find(
        (ubl) => ubl.userId === userId && ubl.bookId === bookId,
      ) || null
    );
  }

  async update(
    id: number,
    data: {
      status?: ListStatus;
      rating?: number;
      progress?: number;
      startDate?: Date;
      finishDate?: Date;
      notes?: string;
    },
  ): Promise<UserBookList> {
    const index = this.userBookLists.findIndex((ubl) => ubl.id === id);

    if (index === -1) {
      throw new Error('UserBookList not found');
    }

    this.userBookLists[index] = {
      ...this.userBookLists[index],
      ...data,
      updatedAt: new Date(),
    };

    return this.userBookLists[index];
  }

  async delete(id: number): Promise<void> {
    const index = this.userBookLists.findIndex((ubl) => ubl.id === id);

    if (index === -1) {
      throw new Error('UserBookList not found');
    }

    this.userBookLists.splice(index, 1);
  }
}
