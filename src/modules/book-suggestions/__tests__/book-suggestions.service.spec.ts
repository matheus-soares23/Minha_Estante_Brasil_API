import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BookSuggestionsService } from '../book-suggestions.service';
import { InMemoryBookSuggestionRepository } from '../../../repositories/in-memory';
import { BOOK_SUGGESTION_REPOSITORY } from '../../../repositories/tokens';
import { BookType } from '@prisma/client';

describe('BookSuggestionsService', () => {
  let service: BookSuggestionsService;
  let repository: InMemoryBookSuggestionRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookSuggestionsService,
        {
          provide: BOOK_SUGGESTION_REPOSITORY,
          useClass: InMemoryBookSuggestionRepository,
        },
      ],
    }).compile();

    service = module.get<BookSuggestionsService>(BookSuggestionsService);
    repository = module.get<InMemoryBookSuggestionRepository>(
      BOOK_SUGGESTION_REPOSITORY,
    );
  });

  afterEach(() => {
    repository['bookSuggestions'] = [];
    repository['currentId'] = 1;
  });

  describe('create', () => {
    it('should create a book suggestion successfully', async () => {
      const createBookSuggestionDto = {
        userId: 1,
        title: 'The Great Gatsby',
        genreId: 1,
        type: BookType.novel,
        authors: 'F. Scott Fitzgerald',
      };

      const result = await service.create(createBookSuggestionDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.userId).toBe(createBookSuggestionDto.userId);
      expect(result.title).toBe(createBookSuggestionDto.title);
      expect(result.genreId).toBe(createBookSuggestionDto.genreId);
      expect(result.type).toBe(createBookSuggestionDto.type);
      expect(result.authors).toBe(createBookSuggestionDto.authors);
    });

    it('should create a book suggestion with all optional fields', async () => {
      const createBookSuggestionDto = {
        userId: 1,
        title: 'The Great Gatsby',
        genreId: 1,
        type: BookType.novel,
        publicationDate: '1925-04-10',
        synopsis: 'A story about the Jazz Age',
        coverImage: 'https://example.com/cover.jpg',
        pages: 180,
        authors: 'F. Scott Fitzgerald',
        seriesName: 'Classic American Literature',
        seriesVolumes: 1,
      };

      const result = await service.create(createBookSuggestionDto);

      expect(result).toBeDefined();
      expect(result.synopsis).toBe(createBookSuggestionDto.synopsis);
      expect(result.coverImage).toBe(createBookSuggestionDto.coverImage);
      expect(result.pages).toBe(createBookSuggestionDto.pages);
      expect(result.seriesName).toBe(createBookSuggestionDto.seriesName);
      expect(result.seriesVolumes).toBe(createBookSuggestionDto.seriesVolumes);
    });

    it('should create a book suggestion with different book types', async () => {
      const mangaSuggestion = await service.create({
        userId: 1,
        title: 'One Piece',
        genreId: 2,
        type: BookType.manga,
        authors: 'Eiichiro Oda',
      });

      const lightNovelSuggestion = await service.create({
        userId: 1,
        title: 'Sword Art Online',
        genreId: 3,
        type: BookType.light_novel,
        authors: 'Reki Kawahara',
      });

      expect(mangaSuggestion.type).toBe(BookType.manga);
      expect(lightNovelSuggestion.type).toBe(BookType.light_novel);
    });
  });

  describe('findAll', () => {
    it('should return all book suggestions', async () => {
      await service.create({
        userId: 1,
        title: 'Book 1',
        genreId: 1,
        type: BookType.novel,
        authors: 'Author 1',
      });
      await service.create({
        userId: 2,
        title: 'Book 2',
        genreId: 2,
        type: BookType.manga,
        authors: 'Author 2',
      });

      const result = await service.findAll();

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no suggestions exist', async () => {
      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should return suggestions sorted by creation date (newest first)', async () => {
      const first = await service.create({
        userId: 1,
        title: 'First Book',
        genreId: 1,
        type: BookType.novel,
        authors: 'Author 1',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const second = await service.create({
        userId: 2,
        title: 'Second Book',
        genreId: 2,
        type: BookType.manga,
        authors: 'Author 2',
      });

      const result = await service.findAll();

      expect(result[0].id).toBe(second.id);
      expect(result[1].id).toBe(first.id);
    });
  });

  describe('findOne', () => {
    it('should return a book suggestion by id', async () => {
      const suggestion = await service.create({
        userId: 1,
        title: 'Test Book',
        genreId: 1,
        type: BookType.novel,
        authors: 'Test Author',
      });

      const result = await service.findOne(suggestion.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(suggestion.id);
      expect(result.title).toBe(suggestion.title);
    });

    it('should throw NotFoundException when suggestion does not exist', async () => {
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Book suggestion with ID 999 not found',
      );
    });
  });

  describe('findByUser', () => {
    it('should return all suggestions by a user', async () => {
      await service.create({
        userId: 1,
        title: 'Book 1',
        genreId: 1,
        type: BookType.novel,
        authors: 'Author 1',
      });
      await service.create({
        userId: 1,
        title: 'Book 2',
        genreId: 2,
        type: BookType.manga,
        authors: 'Author 2',
      });
      await service.create({
        userId: 2,
        title: 'Book 3',
        genreId: 3,
        type: BookType.web_novel,
        authors: 'Author 3',
      });

      const result = await service.findByUser(1);

      expect(result).toHaveLength(2);
      expect(result.every((s) => s.userId === 1)).toBeTruthy();
    });

    it('should return empty array when user has no suggestions', async () => {
      const result = await service.findByUser(999);

      expect(result).toEqual([]);
    });

    it('should return suggestions sorted by creation date for a specific user', async () => {
      const first = await service.create({
        userId: 1,
        title: 'First Book',
        genreId: 1,
        type: BookType.novel,
        authors: 'Author 1',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const second = await service.create({
        userId: 1,
        title: 'Second Book',
        genreId: 2,
        type: BookType.manga,
        authors: 'Author 2',
      });

      const result = await service.findByUser(1);

      expect(result[0].id).toBe(second.id);
      expect(result[1].id).toBe(first.id);
    });
  });

  describe('remove', () => {
    it('should remove a book suggestion successfully', async () => {
      const suggestion = await service.create({
        userId: 1,
        title: 'Book to delete',
        genreId: 1,
        type: BookType.novel,
        authors: 'Author',
      });

      await service.remove(suggestion.id);

      await expect(service.findOne(suggestion.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when removing non-existent suggestion', async () => {
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should only remove the specified suggestion', async () => {
      const first = await service.create({
        userId: 1,
        title: 'First Book',
        genreId: 1,
        type: BookType.novel,
        authors: 'Author 1',
      });

      const second = await service.create({
        userId: 1,
        title: 'Second Book',
        genreId: 2,
        type: BookType.manga,
        authors: 'Author 2',
      });

      await service.remove(first.id);

      const remaining = await service.findAll();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(second.id);
    });
  });
});
