import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IBookRepository,
  CreateBookData,
  UpdateBookData,
  BookWithRelations,
  FindAllBooksFilters,
  BookSortBy,
  BookStatisticsOperation,
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

  async updateBookStatistics(
    bookId: number,
    operation?: BookStatisticsOperation,
    oldRating?: number,
    newRating?: number,
  ): Promise<void> {
    if (!operation) {
      const [popularity, reviewsData] = await Promise.all([
        this.prisma.userBookList.count({
          where: { bookId },
        }),
        this.prisma.review.aggregate({
          where: { bookId, rating: { not: null } },
          _avg: { rating: true },
          _count: { rating: true },
        }),
      ]);

      await this.prisma.bookStatistics.upsert({
        where: { bookId },
        create: {
          bookId,
          popularity,
          averageRating: reviewsData._avg.rating,
          totalReviews: reviewsData._count.rating,
        },
        update: {
          popularity,
          averageRating: reviewsData._avg.rating,
          totalReviews: reviewsData._count.rating,
        },
      });
      return;
    }

    const currentStats = await this.prisma.bookStatistics.findUnique({
      where: { bookId },
    });

    let newPopularity = currentStats?.popularity || 0;
    let newAverageRating = currentStats?.averageRating || null;
    let newTotalReviews = currentStats?.totalReviews || 0;

    // Atualização incremental baseada na operação
    switch (operation) {
      case BookStatisticsOperation.ADD:
        // Incrementa popularidade ao adicionar à lista
        newPopularity += 1;

        // Se tem rating, atualiza média incrementalmente
        if (newRating !== undefined && newRating !== null) {
          if (newTotalReviews === 0) {
            newAverageRating = newRating;
          } else {
            // Fórmula: nova_média = (média_antiga * count + novo_rating) / (count + 1)
            newAverageRating =
              ((currentStats.averageRating || 0) * newTotalReviews +
                newRating) /
              (newTotalReviews + 1);
          }
          newTotalReviews += 1;
        }
        break;

      case BookStatisticsOperation.REMOVE:
        // Decrementa popularidade ao remover da lista
        newPopularity = Math.max(0, newPopularity - 1);

        // Se tinha rating, atualiza média incrementalmente
        if (
          oldRating !== undefined &&
          oldRating !== null &&
          newTotalReviews > 0
        ) {
          if (newTotalReviews === 1) {
            newAverageRating = null;
            newTotalReviews = 0;
          } else {
            // Fórmula: nova_média = (média_antiga * count - rating_removido) / (count - 1)
            newAverageRating =
              ((currentStats.averageRating || 0) * newTotalReviews -
                oldRating) /
              (newTotalReviews - 1);
            newTotalReviews -= 1;
          }
        }
        break;

      case BookStatisticsOperation.UPDATE:
        // Popularidade não muda
        // Se o rating mudou, atualiza média incrementalmente
        const hadOldRating = oldRating !== undefined && oldRating !== null;
        const hasNewRating = newRating !== undefined && newRating !== null;

        if (hadOldRating && !hasNewRating) {
          // Removeu o rating
          if (newTotalReviews === 1) {
            newAverageRating = null;
            newTotalReviews = 0;
          } else {
            newAverageRating =
              ((currentStats.averageRating || 0) * newTotalReviews -
                oldRating) /
              (newTotalReviews - 1);
            newTotalReviews -= 1;
          }
        } else if (!hadOldRating && hasNewRating) {
          // Adicionou um rating
          if (newTotalReviews === 0) {
            newAverageRating = newRating;
          } else {
            newAverageRating =
              ((currentStats.averageRating || 0) * newTotalReviews +
                newRating) /
              (newTotalReviews + 1);
          }
          newTotalReviews += 1;
        } else if (hadOldRating && hasNewRating && oldRating !== newRating) {
          // Mudou o rating. Nova_média = (média_antiga * count - rating_antigo + rating_novo) / count
          newAverageRating =
            ((currentStats.averageRating || 0) * newTotalReviews -
              oldRating +
              newRating) /
            newTotalReviews;
        }
        break;
    }

    await this.prisma.bookStatistics.upsert({
      where: { bookId },
      create: {
        bookId,
        popularity: newPopularity,
        averageRating: newAverageRating,
        totalReviews: newTotalReviews,
      },
      update: {
        popularity: newPopularity,
        averageRating: newAverageRating,
        totalReviews: newTotalReviews,
      },
    });
  }
}
