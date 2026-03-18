import { Injectable } from '@nestjs/common';
import {
  IBookSuggestionRepository,
  CreateBookSuggestionData,
  BookSuggestion,
} from '../interfaces/book-suggestion.repository.interface';

@Injectable()
export class InMemoryBookSuggestionRepository implements IBookSuggestionRepository {
  private bookSuggestions: BookSuggestion[] = [];
  private currentId = 1;

  async create(data: CreateBookSuggestionData): Promise<BookSuggestion> {
    const bookSuggestion: BookSuggestion = {
      id: this.currentId++,
      userId: data.userId,
      title: data.title,
      genreId: data.genreId,
      type: data.type,
      publicationDate: data.publicationDate || null,
      synopsis: data.synopsis || null,
      coverImage: data.coverImage || null,
      pages: data.pages || null,
      authors: data.authors,
      seriesName: data.seriesName || null,
      seriesVolumes: data.seriesVolumes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.bookSuggestions.push(bookSuggestion);
    return bookSuggestion;
  }

  async findAll(): Promise<BookSuggestion[]> {
    return [...this.bookSuggestions].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async findOne(id: number): Promise<BookSuggestion | null> {
    return (
      this.bookSuggestions.find((suggestion) => suggestion.id === id) || null
    );
  }

  async findByUser(userId: number): Promise<BookSuggestion[]> {
    return this.bookSuggestions
      .filter((suggestion) => suggestion.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async delete(id: number): Promise<void> {
    const index = this.bookSuggestions.findIndex(
      (suggestion) => suggestion.id === id,
    );

    if (index === -1) {
      throw new Error('Book suggestion not found');
    }

    this.bookSuggestions.splice(index, 1);
  }
}
