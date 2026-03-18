import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateBookSuggestionDto } from './dto';
import { IBookSuggestionRepository } from '../../repositories/interfaces';
import { BOOK_SUGGESTION_REPOSITORY } from '../../repositories/tokens';

@Injectable()
export class BookSuggestionsService {
  constructor(
    @Inject(BOOK_SUGGESTION_REPOSITORY)
    private readonly bookSuggestionRepository: IBookSuggestionRepository,
  ) {}

  async create(createBookSuggestionDto: CreateBookSuggestionDto) {
    const bookSuggestion = await this.bookSuggestionRepository.create({
      userId: createBookSuggestionDto.userId,
      title: createBookSuggestionDto.title,
      genreId: createBookSuggestionDto.genreId,
      type: createBookSuggestionDto.type,
      publicationDate: createBookSuggestionDto.publicationDate
        ? new Date(createBookSuggestionDto.publicationDate)
        : undefined,
      synopsis: createBookSuggestionDto.synopsis,
      coverImage: createBookSuggestionDto.coverImage,
      pages: createBookSuggestionDto.pages,
      authors: createBookSuggestionDto.authors,
      seriesName: createBookSuggestionDto.seriesName,
      seriesVolumes: createBookSuggestionDto.seriesVolumes,
    });

    return bookSuggestion;
  }

  async findAll() {
    return this.bookSuggestionRepository.findAll();
  }

  async findOne(id: number) {
    const bookSuggestion = await this.bookSuggestionRepository.findOne(id);

    if (!bookSuggestion) {
      throw new NotFoundException(`Book suggestion with ID ${id} not found`);
    }

    return bookSuggestion;
  }

  async findByUser(userId: number) {
    return this.bookSuggestionRepository.findByUser(userId);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.bookSuggestionRepository.delete(id);
  }
}
