import { Injectable } from '@nestjs/common';
import { Review } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IReviewRepository } from '../interfaces/review.repository.interface';

@Injectable()
export class PrismaReviewRepository implements IReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: number;
    bookId: number;
    rating?: number;
    title?: string;
    content?: string;
  }): Promise<Review> {
    return this.prisma.review.create({
      data,
    });
  }

  async findAll(): Promise<Review[]> {
    return this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<Review | null> {
    return this.prisma.review.findUnique({
      where: { id },
    });
  }

  async findByBook(bookId: number): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: { bookId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: number): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: number,
    data: {
      rating?: number;
      title?: string;
      content?: string;
    },
  ): Promise<Review> {
    return this.prisma.review.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.review.delete({
      where: { id },
    });
  }
}
