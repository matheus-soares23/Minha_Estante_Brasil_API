import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IBookRepository,
  CreateBookData,
  UpdateBookData,
  BookWithRelations,
} from '../interfaces';

@Injectable()
export class PrismaBookRepository implements IBookRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBookData): Promise<BookWithRelations> {
    const { authors, genreIds, ...bookData } = data;

    return this.prisma.book.create({
      data: {
        title: bookData.title,
        originalTitle: bookData.originalTitle,
        synopsis: bookData.synopsis,
        publicationDate: bookData.publicationDate,
        coverImage: bookData.coverImage,
        pages: bookData.pages,
        isbn10: bookData.isbn10,
        isbn13: bookData.isbn13,
        status: bookData.status,
        type: bookData.type,
        authors: authors
          ? {
              create: authors.map((author) => ({
                authorId: author.authorId,
                role: author.role,
              })),
            }
          : undefined,
        genres: genreIds
          ? {
              create: genreIds.map((genreId) => ({
                genreId,
              })),
            }
          : undefined,
      },
      include: {
        authors: {
          include: {
            author: true,
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
      },
    });
  }

  async findAll(): Promise<BookWithRelations[]> {
    return this.prisma.book.findMany({
      include: {
        authors: {
          include: {
            author: true,
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: number): Promise<BookWithRelations | null> {
    return this.prisma.book.findUnique({
      where: { id },
      include: {
        authors: {
          include: {
            author: true,
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
        seriesBooks: {
          include: {
            series: true,
          },
        },
      },
    });
  }

  async findByAuthor(authorId: number): Promise<BookWithRelations[]> {
    return this.prisma.book.findMany({
      where: {
        authors: {
          some: {
            authorId,
          },
        },
      },
      include: {
        authors: {
          include: {
            author: true,
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  async update(id: number, data: UpdateBookData): Promise<BookWithRelations> {
    const { authors, genreIds, ...bookData } = data;

    return this.prisma.book.update({
      where: { id },
      data: {
        title: bookData.title,
        originalTitle: bookData.originalTitle,
        synopsis: bookData.synopsis,
        publicationDate: bookData.publicationDate,
        coverImage: bookData.coverImage,
        pages: bookData.pages,
        isbn10: bookData.isbn10,
        isbn13: bookData.isbn13,
        status: bookData.status,
        type: bookData.type,
        authors: authors
          ? {
              create: authors.map((author) => ({
                authorId: author.authorId,
                role: author.role,
              })),
            }
          : undefined,
        genres: genreIds
          ? {
              create: genreIds.map((genreId) => ({
                genreId,
              })),
            }
          : undefined,
      },
      include: {
        authors: {
          include: {
            author: true,
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.book.delete({
      where: { id },
    });
  }

  async deleteBookAuthors(bookId: number): Promise<void> {
    await this.prisma.bookAuthor.deleteMany({
      where: { bookId },
    });
  }

  async deleteBookGenres(bookId: number): Promise<void> {
    await this.prisma.bookGenre.deleteMany({
      where: { bookId },
    });
  }
}
