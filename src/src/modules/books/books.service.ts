import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateBookDto, UpdateBookDto } from './dto';
import { IBookRepository } from '../../repositories/interfaces';
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

  async findAll() {
    return this.bookRepository.findAll();
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
}
