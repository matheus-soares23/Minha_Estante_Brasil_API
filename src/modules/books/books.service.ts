import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  CreateBookDto,
  UpdateBookDto,
  FindAllBooksFiltersDto,
  BookSortBy,
} from './dto';
import {
  IBookRepository,
  FindAllBooksFilters,
} from '../../repositories/interfaces';
import { BOOK_REPOSITORY } from '../../repositories/tokens';

@Injectable()
export class BooksService {
  constructor(
    @Inject(BOOK_REPOSITORY)
    private readonly bookRepository: IBookRepository,
  ) {}

  async create(createBookDto: CreateBookDto) {
    const { authors, genreIds, ...bookData } = createBookDto;

    return this.bookRepository.create({
      title: bookData.title,
      originalTitle: bookData.originalTitle,
      synopsis: bookData.synopsis,
      publicationDate: bookData.publicationDate
        ? new Date(bookData.publicationDate)
        : undefined,
      coverImage: bookData.coverImage,
      pages: bookData.pages,
      isbn10: bookData.isbn10,
      isbn13: bookData.isbn13,
      status: bookData.status,
      type: bookData.type,
      authors,
      genreIds,
    });
  }

  async findAll(queryDto?: FindAllBooksFiltersDto) {
    const filters: FindAllBooksFilters = {};

    if (queryDto?.sortBy) {
      filters.sortBy = queryDto.sortBy as BookSortBy;
    }

    if (queryDto?.sortOrder) {
      filters.sortOrder = queryDto.sortOrder;
    }

    if (queryDto?.startDate) {
      filters.startDate = new Date(queryDto.startDate);
    }

    if (queryDto?.endDate) {
      filters.endDate = new Date(queryDto.endDate);
    }

    if (queryDto?.genreId) {
      filters.genreId = queryDto.genreId;
    }

    return this.bookRepository.findAll(filters);
  }

  async findOne(id: number) {
    const book = await this.bookRepository.findOne(id);

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async findByAuthor(authorId: number) {
    return this.bookRepository.findByAuthor(authorId);
  }

  async update(id: number, updateBookDto: UpdateBookDto) {
    await this.findOne(id);

    const { authors, genreIds, ...bookData } = updateBookDto;

    if (authors) {
      await this.bookRepository.deleteBookAuthors(id);
    }

    if (genreIds) {
      await this.bookRepository.deleteBookGenres(id);
    }

    return this.bookRepository.update(id, {
      title: bookData.title,
      originalTitle: bookData.originalTitle,
      synopsis: bookData.synopsis,
      publicationDate: bookData.publicationDate
        ? new Date(bookData.publicationDate)
        : undefined,
      coverImage: bookData.coverImage,
      pages: bookData.pages,
      isbn10: bookData.isbn10,
      isbn13: bookData.isbn13,
      status: bookData.status,
      type: bookData.type,
      authors,
      genreIds,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.bookRepository.delete(id);
  }

  // Método para recalcular popularidade e rating, ainda não usado no fluxo
  async recalculateBookStatistics(bookId: number): Promise<void> {
    const [popularity, ratingsData] = await Promise.all([
      this.bookRepository.countUserBookListByBook(bookId),
      this.bookRepository.aggregateRatingsByBook(bookId),
    ]);

    await this.bookRepository.upsertBookStatistics({
      bookId,
      popularity,
      averageRating: ratingsData.averageRating,
      totalReviews: ratingsData.totalReviews,
    });
  }

  async handleUserBookListAdded(
    bookId: number,
    rating?: number,
  ): Promise<void> {
    const currentStats = await this.bookRepository.getBookStatistics(bookId);

    const newPopularity = (currentStats?.popularity || 0) + 1;
    let newAverageRating = currentStats?.averageRating || null;
    let newTotalReviews = currentStats?.totalReviews || 0;

    // Se tem rating, atualiza média incrementalmente
    if (rating !== undefined && rating !== null) {
      if (newTotalReviews === 0) {
        newAverageRating = rating;
      } else {
        // Fórmula: nova_média = (média_antiga * count + novo_rating) / (count + 1)
        newAverageRating =
          ((currentStats?.averageRating || 0) * newTotalReviews + rating) /
          (newTotalReviews + 1);
      }
      newTotalReviews += 1;
    }

    await this.bookRepository.upsertBookStatistics({
      bookId,
      popularity: newPopularity,
      averageRating: newAverageRating,
      totalReviews: newTotalReviews,
    });
  }

  async handleUserBookListRemoved(
    bookId: number,
    rating?: number,
  ): Promise<void> {
    const currentStats = await this.bookRepository.getBookStatistics(bookId);
    if (!currentStats) return;

    const newPopularity = Math.max(0, currentStats.popularity - 1);
    let newAverageRating = currentStats.averageRating;
    let newTotalReviews = currentStats.totalReviews;

    // Se tinha rating, atualiza média incrementalmente
    if (rating !== undefined && rating !== null && newTotalReviews > 0) {
      if (newTotalReviews === 1) {
        newAverageRating = null;
        newTotalReviews = 0;
      } else {
        // Fórmula: nova_média = (média_antiga * count - rating_removido) / (count - 1)
        newAverageRating =
          ((currentStats.averageRating || 0) * newTotalReviews - rating) /
          (newTotalReviews - 1);
        newTotalReviews -= 1;
      }
    }

    await this.bookRepository.upsertBookStatistics({
      bookId,
      popularity: newPopularity,
      averageRating: newAverageRating,
      totalReviews: newTotalReviews,
    });
  }

  async handleUserBookListUpdated(
    bookId: number,
    oldRating?: number,
    newRating?: number,
  ): Promise<void> {
    const currentStats = await this.bookRepository.getBookStatistics(bookId);
    if (!currentStats) return;

    // Popularidade não muda
    const newPopularity = currentStats.popularity;
    let newAverageRating = currentStats.averageRating;
    let newTotalReviews = currentStats.totalReviews;

    const hadOldRating = oldRating !== undefined && oldRating !== null;
    const hasNewRating = newRating !== undefined && newRating !== null;

    if (hadOldRating && !hasNewRating) {
      // Removeu o rating
      if (newTotalReviews === 1) {
        newAverageRating = null;
        newTotalReviews = 0;
      } else {
        newAverageRating =
          ((currentStats.averageRating || 0) * newTotalReviews - oldRating) /
          (newTotalReviews - 1);
        newTotalReviews -= 1;
      }
    } else if (!hadOldRating && hasNewRating) {
      // Adicionou um rating
      if (newTotalReviews === 0) {
        newAverageRating = newRating;
      } else {
        newAverageRating =
          ((currentStats.averageRating || 0) * newTotalReviews + newRating) /
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

    await this.bookRepository.upsertBookStatistics({
      bookId,
      popularity: newPopularity,
      averageRating: newAverageRating,
      totalReviews: newTotalReviews,
    });
  }
}
