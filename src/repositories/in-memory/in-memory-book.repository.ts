import {
  IBookRepository,
  CreateBookData,
  UpdateBookData,
  BookWithRelations,
  FindAllBooksFilters,
  BookSortBy,
} from '../interfaces';

export class InMemoryBookRepository implements IBookRepository {
  private books: BookWithRelations[] = [];
  private currentId = 1;

  // Método auxiliar para acessar os dados internos nos testes
  getBooks(): BookWithRelations[] {
    return [...this.books];
  }

  // Método auxiliar para limpar os dados entre testes
  clear(): void {
    this.books = [];
    this.currentId = 1;
  }

  // Método auxiliar para popular dados de teste
  seed(books: BookWithRelations[]): void {
    this.books = books;
    this.currentId = Math.max(...books.map((b) => b.id), 0) + 1;
  }

  async create(data: CreateBookData): Promise<BookWithRelations> {
    const now = new Date();
    const book: BookWithRelations = {
      id: this.currentId++,
      title: data.title,
      originalTitle: data.originalTitle ?? null,
      synopsis: data.synopsis ?? null,
      publicationDate: data.publicationDate ?? null,
      coverImage: data.coverImage ?? null,
      pages: data.pages ?? null,
      isbn10: data.isbn10 ?? null,
      isbn13: data.isbn13 ?? null,
      status: data.status ?? null,
      type: data.type ?? null,
      createdAt: now,
      updatedAt: now,
      authors:
        data.authors?.map((a) => ({
          authorId: a.authorId,
          role: a.role ?? null,
          author: {
            id: a.authorId,
            name: `Author ${a.authorId}`,
            biography: null,
            birthDate: null,
            deathDate: null,
            image: null,
          },
        })) ?? [],
      genres:
        data.genreIds?.map((genreId) => ({
          genreId,
          genre: {
            id: genreId,
            name: `Genre ${genreId}`,
            description: null,
            slug: null,
          },
        })) ?? [],
    };

    this.books.push(book);
    return book;
  }

  async findAll(filters?: FindAllBooksFilters): Promise<BookWithRelations[]> {
    let result = [...this.books];

    if (filters?.startDate) {
      result = result.filter(
        (book) =>
          book.publicationDate && book.publicationDate >= filters.startDate!,
      );
    }

    if (filters?.endDate) {
      result = result.filter(
        (book) =>
          book.publicationDate && book.publicationDate <= filters.endDate!,
      );
    }

    if (filters?.genreId) {
      result = result.filter((book) =>
        book.genres.some((g) => g.genreId === filters.genreId),
      );
    }

    const sortOrder = filters?.sortOrder || 'asc';
    const sortBy = filters?.sortBy || BookSortBy.TITLE;

    switch (sortBy) {
      case BookSortBy.TITLE:
        result.sort((a, b) => {
          const comparison = a.title.localeCompare(b.title);
          return sortOrder === 'asc' ? comparison : -comparison;
        });
        break;
      case BookSortBy.PUBLICATION_DATE:
        result.sort((a, b) => {
          const dateA = a.publicationDate?.getTime() ?? 0;
          const dateB = b.publicationDate?.getTime() ?? 0;
          const comparison = dateA - dateB;
          return sortOrder === 'asc' ? comparison : -comparison;
        });
        break;
      default:
        result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }

  async findOne(id: number): Promise<BookWithRelations | null> {
    const book = this.books.find((b) => b.id === id);
    if (!book) return null;
    return { ...book, seriesBooks: [] };
  }

  async findByAuthor(authorId: number): Promise<BookWithRelations[]> {
    return this.books
      .filter((book) => book.authors.some((a) => a.authorId === authorId))
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  async update(id: number, data: UpdateBookData): Promise<BookWithRelations> {
    const index = this.books.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error(`Book with ID ${id} not found`);
    }

    const existingBook = this.books[index];
    const updatedBook: BookWithRelations = {
      ...existingBook,
      title: data.title ?? existingBook.title,
      originalTitle: data.originalTitle ?? existingBook.originalTitle,
      synopsis: data.synopsis ?? existingBook.synopsis,
      publicationDate: data.publicationDate ?? existingBook.publicationDate,
      coverImage: data.coverImage ?? existingBook.coverImage,
      pages: data.pages ?? existingBook.pages,
      isbn10: data.isbn10 ?? existingBook.isbn10,
      isbn13: data.isbn13 ?? existingBook.isbn13,
      status: data.status ?? existingBook.status,
      type: data.type ?? existingBook.type,
      updatedAt: new Date(),
      authors:
        data.authors?.map((a) => ({
          authorId: a.authorId,
          role: a.role ?? null,
          author: {
            id: a.authorId,
            name: `Author ${a.authorId}`,
            biography: null,
            birthDate: null,
            deathDate: null,
            image: null,
          },
        })) ?? existingBook.authors,
      genres:
        data.genreIds?.map((genreId) => ({
          genreId,
          genre: {
            id: genreId,
            name: `Genre ${genreId}`,
            description: null,
            slug: null,
          },
        })) ?? existingBook.genres,
    };

    this.books[index] = updatedBook;
    return updatedBook;
  }

  async delete(id: number): Promise<void> {
    const index = this.books.findIndex((b) => b.id === id);
    if (index !== -1) {
      this.books.splice(index, 1);
    }
  }

  async deleteBookAuthors(bookId: number): Promise<void> {
    const book = this.books.find((b) => b.id === bookId);
    if (book) {
      book.authors = [];
    }
  }

  async deleteBookGenres(bookId: number): Promise<void> {
    const book = this.books.find((b) => b.id === bookId);
    if (book) {
      book.genres = [];
    }
  }
}
