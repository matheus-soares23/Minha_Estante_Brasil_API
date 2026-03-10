import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BooksService } from './books.service';
import { InMemoryBookRepository } from '../../repositories/in-memory';
import { BOOK_REPOSITORY } from '../../repositories/tokens';
import { BookSortBy, SortOrder } from './dto';

describe('BooksService', () => {
  let service: BooksService;
  let repository: InMemoryBookRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: BOOK_REPOSITORY,
          useClass: InMemoryBookRepository,
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    repository = module.get<InMemoryBookRepository>(BOOK_REPOSITORY);
  });

  afterEach(() => {
    repository.clear();
  });

  describe('create', () => {
    it('should create a book successfully', async () => {
      const createBookDto = {
        title: 'Dom Casmurro',
        originalTitle: 'Dom Casmurro',
        synopsis: 'A classic Brazilian novel',
        publicationDate: '1899-01-01',
        coverImage: 'cover.jpg',
        pages: 256,
        isbn10: '1234567890',
        isbn13: '1234567890123',
        authors: [{ authorId: 1, role: 'writer' }],
        genreIds: [1, 2],
      } as any;

      const result = await service.create(createBookDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.title).toBe(createBookDto.title);
      expect(result.pages).toBe(createBookDto.pages);
      expect(result.authors).toHaveLength(1);
      expect(result.genres).toHaveLength(2);
    });

    it('should create a book without optional fields', async () => {
      const createBookDto = {
        title: 'Memórias Póstumas de Brás Cubas',
      };

      const result = await service.create(createBookDto);

      expect(result).toBeDefined();
      expect(result.title).toBe(createBookDto.title);
      expect(result.synopsis).toBeNull();
      expect(result.pages).toBeNull();
    });

    it('should create a book with authors and genres', async () => {
      const createBookDto = {
        title: 'Grande Sertão: Veredas',
        authors: [
          { authorId: 1, role: 'writer' },
          { authorId: 2, role: 'illustrator' },
        ],
        genreIds: [1, 2, 3],
      };

      const result = await service.create(createBookDto);

      expect(result.authors).toHaveLength(2);
      expect(result.genres).toHaveLength(3);
    });
  });

  describe('findAll', () => {
    it('should return all books', async () => {
      await service.create({ title: 'Book 1' });
      await service.create({ title: 'Book 2' });
      await service.create({ title: 'Book 3' });

      const result = await service.findAll();

      expect(result).toHaveLength(3);
    });

    it('should return empty array when no books exist', async () => {
      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should filter books by genre', async () => {
      await service.create({ title: 'Book 1', genreIds: [1] });
      await service.create({ title: 'Book 2', genreIds: [2] });
      await service.create({ title: 'Book 3', genreIds: [1, 2] });

      const result = await service.findAll({ genreId: 1 });

      expect(result).toHaveLength(2);
      expect(
        result.every((book) => book.genres.some((g) => g.genreId === 1)),
      ).toBeTruthy();
    });

    it('should sort books by title ascending', async () => {
      await service.create({ title: 'Zebra' });
      await service.create({ title: 'Apple' });
      await service.create({ title: 'Mango' });

      const result = await service.findAll({
        sortBy: BookSortBy.TITLE,
        sortOrder: SortOrder.ASC,
      } as any);

      expect(result[0].title).toBe('Apple');
      expect(result[1].title).toBe('Mango');
      expect(result[2].title).toBe('Zebra');
    });

    it('should sort books by title descending', async () => {
      await service.create({ title: 'Zebra' });
      await service.create({ title: 'Apple' });
      await service.create({ title: 'Mango' });

      const result = await service.findAll({
        sortBy: BookSortBy.TITLE,
        sortOrder: SortOrder.DESC,
      } as any);

      expect(result[0].title).toBe('Zebra');
      expect(result[1].title).toBe('Mango');
      expect(result[2].title).toBe('Apple');
    });

    it('should filter books by date range', async () => {
      await service.create({
        title: 'Old Book',
        publicationDate: '1900-01-01',
      });
      await service.create({
        title: 'Recent Book',
        publicationDate: '2020-01-01',
      });
      await service.create({
        title: 'Modern Book',
        publicationDate: '2023-01-01',
      });

      const result = await service.findAll({
        startDate: '2019-01-01',
        endDate: '2021-12-31',
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Recent Book');
    });
  });

  describe('findOne', () => {
    it('should return a book by id', async () => {
      const book = await service.create({
        title: 'Test Book',
        synopsis: 'Test Synopsis',
      });

      const result = await service.findOne(book.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(book.id);
      expect(result.title).toBe(book.title);
    });

    it('should throw NotFoundException when book does not exist', async () => {
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Book with ID 999 not found',
      );
    });
  });

  describe('findByAuthor', () => {
    it('should return all books by an author', async () => {
      await service.create({
        title: 'Book 1',
        authors: [{ authorId: 1, role: 'writer' }],
      });
      await service.create({
        title: 'Book 2',
        authors: [{ authorId: 1, role: 'writer' }],
      });
      await service.create({
        title: 'Book 3',
        authors: [{ authorId: 2, role: 'writer' }],
      });

      const result = await service.findByAuthor(1);

      expect(result).toHaveLength(2);
      expect(
        result.every((book) => book.authors.some((a) => a.authorId === 1)),
      ).toBeTruthy();
    });

    it('should return empty array when author has no books', async () => {
      const result = await service.findByAuthor(999);

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a book successfully', async () => {
      const book = await service.create({
        title: 'Original Title',
        synopsis: 'Original Synopsis',
      });

      const updateDto = {
        title: 'Updated Title',
        synopsis: 'Updated Synopsis',
        pages: 300,
      };

      const result = await service.update(book.id, updateDto);

      expect(result.title).toBe(updateDto.title);
      expect(result.synopsis).toBe(updateDto.synopsis);
      expect(result.pages).toBe(updateDto.pages);
    });

    it('should throw NotFoundException when updating non-existent book', async () => {
      await expect(service.update(999, { title: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update book with new authors', async () => {
      const book = await service.create({
        title: 'Test Book',
        authors: [{ authorId: 1, role: 'writer' }],
      });

      const result = await service.update(book.id, {
        authors: [
          { authorId: 2, role: 'writer' },
          { authorId: 3, role: 'illustrator' },
        ],
      });

      expect(result.authors).toHaveLength(2);
      expect(result.authors[0].authorId).toBe(2);
    });

    it('should update book with new genres', async () => {
      const book = await service.create({
        title: 'Test Book',
        genreIds: [1, 2],
      });

      const result = await service.update(book.id, {
        genreIds: [3, 4, 5],
      });

      expect(result.genres).toHaveLength(3);
    });
  });

  describe('remove', () => {
    it('should remove a book successfully', async () => {
      const book = await service.create({
        title: 'Book to delete',
      });

      await service.remove(book.id);

      await expect(service.findOne(book.id)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when removing non-existent book', async () => {
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
