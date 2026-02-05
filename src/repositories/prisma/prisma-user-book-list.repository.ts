import { Injectable } from '@nestjs/common';
import { UserBookList, ListStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IUserBookListRepository } from '../interfaces/user-book-list.repository.interface';

@Injectable()
export class PrismaUserBookListRepository implements IUserBookListRepository {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.userBookList.create({
      data,
    });
  }

  async findAll(): Promise<UserBookList[]> {
    return this.prisma.userBookList.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<UserBookList | null> {
    return this.prisma.userBookList.findUnique({
      where: { id },
    });
  }

  async findByUser(userId: number): Promise<UserBookList[]> {
    return this.prisma.userBookList.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findByUserAndBook(
    userId: number,
    bookId: number,
  ): Promise<UserBookList | null> {
    return this.prisma.userBookList.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    });
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
    return this.prisma.userBookList.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.userBookList.delete({
      where: { id },
    });
  }
}
