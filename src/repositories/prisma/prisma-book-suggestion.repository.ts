import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IBookSuggestionRepository,
  CreateBookSuggestionData,
  BookSuggestion,
} from '../interfaces/book-suggestion.repository.interface';

@Injectable()
export class PrismaBookSuggestionRepository implements IBookSuggestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBookSuggestionData): Promise<BookSuggestion> {
    return this.prisma.bookSuggestion.create({
      data,
    });
  }

  async findAll(): Promise<BookSuggestion[]> {
    return this.prisma.bookSuggestion.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        genre: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: number): Promise<BookSuggestion | null> {
    return this.prisma.bookSuggestion.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        genre: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findByUser(userId: number): Promise<BookSuggestion[]> {
    return this.prisma.bookSuggestion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        genre: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.bookSuggestion.delete({
      where: { id },
    });
  }
}
