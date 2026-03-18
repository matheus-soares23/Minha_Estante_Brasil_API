import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IBookRepository,
  CreateBookData,
  UpdateBookData,
  BookWithRelations,
  FindAllBooksFilters,
  BookSortBy,
  BookStatistics,
  BookRatingAggregation,
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

  async findAll(filters?: FindAllBooksFilters): Promise<BookWithRelations[]> {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.publicationDate = {};
      if (filters.startDate) {
        where.publicationDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.publicationDate.lte = filters.endDate;
      }
    }

    if (filters?.genreId) {
      where.genres = {
        some: {
          genreId: filters.genreId,
        },
      };
    }

    if (filters?.bookType) {
      where.type = filters.bookType;
    }

    let orderBy: any = { title: 'asc' };

    if (filters?.sortBy) {
      const sortOrder = filters.sortOrder || 'desc';

      switch (filters.sortBy) {
        case BookSortBy.TITLE:
          orderBy = { title: sortOrder };
          break;
        case BookSortBy.PUBLICATION_DATE:
          orderBy = { publicationDate: sortOrder };
          break;
        case BookSortBy.RATING:
          orderBy = { statistics: { averageRating: sortOrder } };
          break;
        case BookSortBy.POPULARITY:
          orderBy = { statistics: { popularity: sortOrder } };
          break;
        default:
          orderBy = { title: 'asc' };
      }
    }

    return this.prisma.book.findMany({
      where,
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
      orderBy,
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

  async getBookStatistics(bookId: number): Promise<BookStatistics | null> {
    return this.prisma.bookStatistics.findUnique({
      where: { bookId },
    });
  }

  async upsertBookStatistics(data: BookStatistics): Promise<void> {
    await this.prisma.bookStatistics.upsert({
      where: { bookId: data.bookId },
      create: {
        bookId: data.bookId,
        popularity: data.popularity,
        averageRating: data.averageRating,
        totalReviews: data.totalReviews,
      },
      update: {
        popularity: data.popularity,
        averageRating: data.averageRating,
        totalReviews: data.totalReviews,
      },
    });
  }

  async countUserBookListByBook(bookId: number): Promise<number> {
    return this.prisma.userBookList.count({
      where: { bookId },
    });
  }

  async aggregateRatingsByBook(bookId: number): Promise<BookRatingAggregation> {
    const result = await this.prisma.userBookList.aggregate({
      where: { bookId, rating: { not: null } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: result._avg.rating,
      totalReviews: result._count.rating,
    };
  }
}
