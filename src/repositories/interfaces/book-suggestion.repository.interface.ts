import { BookType } from '@prisma/client';

export interface BookSuggestion {
  id: number;
  userId: number;
  title: string;
  genreId: number;
  type: BookType;
  publicationDate: Date | null;
  synopsis: string | null;
  coverImage: string | null;
  pages: number | null;
  authors: string;
  seriesName: string | null;
  seriesVolumes: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookSuggestionData {
  userId: number;
  title: string;
  genreId: number;
  type: BookType;
  publicationDate?: Date;
  synopsis?: string;
  coverImage?: string;
  pages?: number;
  authors: string;
  seriesName?: string;
  seriesVolumes?: number;
}

export interface IBookSuggestionRepository {
  create(data: CreateBookSuggestionData): Promise<BookSuggestion>;

  findAll(): Promise<BookSuggestion[]>;

  findOne(id: number): Promise<BookSuggestion | null>;

  findByUser(userId: number): Promise<BookSuggestion[]>;

  delete(id: number): Promise<void>;
}
