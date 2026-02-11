import { BookStatus, BookType } from '@prisma/client';

export enum BookSortBy {
  TITLE = 'title',
  RATING = 'rating',
  POPULARITY = 'popularity',
  PUBLICATION_DATE = 'publicationDate',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface FindAllBooksFilters {
  sortBy?: BookSortBy;
  sortOrder?: SortOrder;
  startDate?: Date;
  endDate?: Date;
  genreId?: number;
}

export interface BookAuthorInput {
  authorId: number;
  role?: string;
}

export interface CreateBookData {
  title: string;
  originalTitle?: string;
  synopsis?: string;
  publicationDate?: Date;
  coverImage?: string;
  pages?: number;
  isbn10?: string;
  isbn13?: string;
  status?: BookStatus;
  type?: BookType;
  authors?: BookAuthorInput[];
  genreIds?: number[];
}

export interface UpdateBookData {
  title?: string;
  originalTitle?: string;
  synopsis?: string;
  publicationDate?: Date;
  coverImage?: string;
  pages?: number;
  isbn10?: string;
  isbn13?: string;
  status?: BookStatus;
  type?: BookType;
  authors?: BookAuthorInput[];
  genreIds?: number[];
}

export interface BookWithRelations {
  id: number;
  title: string;
  originalTitle: string | null;
  synopsis: string | null;
  publicationDate: Date | null;
  coverImage: string | null;
  pages: number | null;
  isbn10: string | null;
  isbn13: string | null;
  status: BookStatus | null;
  type: BookType | null;
  createdAt: Date;
  updatedAt: Date;
  authors: {
    authorId: number;
    role: string | null;
    author: {
      id: number;
      name: string;
      biography: string | null;
      birthDate: Date | null;
      deathDate: Date | null;
      image: string | null;
    };
  }[];
  genres: {
    genreId: number;
    genre: {
      id: number;
      name: string;
      description: string | null;
      slug: string | null;
    };
  }[];
  seriesBooks?: {
    seriesId: number;
    volumeNumber: number | null;
    series: {
      id: number;
      name: string;
      description: string | null;
      slug: string | null;
    };
  }[];
}

export interface IBookRepository {
  create(data: CreateBookData): Promise<BookWithRelations>;
  findAll(filters?: FindAllBooksFilters): Promise<BookWithRelations[]>;
  findOne(id: number): Promise<BookWithRelations | null>;
  findByAuthor(authorId: number): Promise<BookWithRelations[]>;
  update(id: number, data: UpdateBookData): Promise<BookWithRelations>;
  delete(id: number): Promise<void>;
  deleteBookAuthors(bookId: number): Promise<void>;
  deleteBookGenres(bookId: number): Promise<void>;
}
