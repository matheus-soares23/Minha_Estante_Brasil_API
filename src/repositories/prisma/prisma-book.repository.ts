import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IBookRepository,
  CreateBookData,
  UpdateBookData,
  BookWithRelations,
  FindAllBooksFilters,
  BookSortBy,
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
          const booksWithRating = await this.prisma.book.findMany({
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
              reviews: {
                select: {
                  rating: true,
                },
              },
            },
          });

          const booksWithAvgRating = booksWithRating.map((book) => {
            const ratings = book.reviews
              .map((r) => r.rating)
              .filter((r): r is number => r !== null);
            const avgRating =
              ratings.length > 0
                ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
                : 0;
            return { ...book, avgRating };
          });

          booksWithAvgRating.sort((a, b) => {
            if (sortOrder === 'asc') {
              return a.avgRating - b.avgRating;
            }
            return b.avgRating - a.avgRating;
          });

          return booksWithAvgRating.map(
            ({ reviews: _reviews, avgRating: _avgRating, ...book }) => book,
          );

        case BookSortBy.POPULARITY:
          const booksWithPopularity = await this.prisma.book.findMany({
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
              userBookList: true,
            },
          });

          booksWithPopularity.sort((a, b) => {
            if (sortOrder === 'asc') {
              return a.userBookList.length - b.userBookList.length;
            }
            return b.userBookList.length - a.userBookList.length;
          });

          return booksWithPopularity.map(
            ({ userBookList: _userBookList, ...book }) => book,
          );

        default:
          orderBy = { title: 'asc' };
      }
    }

    if (
      !filters?.sortBy ||
      filters.sortBy === BookSortBy.TITLE ||
      filters.sortBy === BookSortBy.PUBLICATION_DATE
    ) {
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

    return [];
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
