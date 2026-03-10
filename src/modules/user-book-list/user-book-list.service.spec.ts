import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserBookListService } from './user-book-list.service';
import {
  InMemoryUserBookListRepository,
  InMemoryBookRepository,
} from '../../repositories/in-memory';
import {
  USER_BOOK_LIST_REPOSITORY,
  BOOK_REPOSITORY,
} from '../../repositories/tokens';
import { ListStatus } from '@prisma/client';
import { BookStatisticsOperation } from '../../repositories/interfaces';

describe('UserBookListService', () => {
  let service: UserBookListService;
  let userBookListRepository: InMemoryUserBookListRepository;
  let bookRepository: InMemoryBookRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserBookListService,
        {
          provide: USER_BOOK_LIST_REPOSITORY,
          useClass: InMemoryUserBookListRepository,
        },
        {
          provide: BOOK_REPOSITORY,
          useClass: InMemoryBookRepository,
        },
      ],
    }).compile();

    service = module.get<UserBookListService>(UserBookListService);
    userBookListRepository = module.get<InMemoryUserBookListRepository>(
      USER_BOOK_LIST_REPOSITORY,
    );
    bookRepository = module.get<InMemoryBookRepository>(BOOK_REPOSITORY);
  });

  afterEach(() => {
    userBookListRepository['userBookLists'] = [];
    userBookListRepository['currentId'] = 1;
    bookRepository.clear();
  });

  describe('create', () => {
    it('should create a user book list entry successfully', async () => {
      const createDto = {
        userId: 1,
        bookId: 1,
        status: ListStatus.reading,
        rating: 5,
        progress: 50,
        startDate: '2024-01-01',
        notes: 'Great book!',
      };

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.userId).toBe(createDto.userId);
      expect(result.bookId).toBe(createDto.bookId);
      expect(result.status).toBe(createDto.status);
      expect(result.rating).toBe(createDto.rating);
      expect(result.progress).toBe(createDto.progress);
    });

    it('should create a user book list entry without optional fields', async () => {
      const createDto = {
        userId: 1,
        bookId: 1,
      };

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.status).toBeNull();
      expect(result.rating).toBeNull();
      expect(result.progress).toBeNull();
      expect(result.notes).toBeNull();
    });

    it('should call updateBookStatistics when creating with rating', async () => {
      const updateStatsSpy = jest.spyOn(bookRepository, 'updateBookStatistics');

      const createDto = {
        userId: 1,
        bookId: 1,
        rating: 4,
      };

      await service.create(createDto);

      expect(updateStatsSpy).toHaveBeenCalledWith(
        1,
        BookStatisticsOperation.ADD,
        undefined,
        4,
      );
    });

    it('should convert date strings to Date objects', async () => {
      const createDto = {
        userId: 1,
        bookId: 1,
        startDate: '2024-01-01',
        finishDate: '2024-02-01',
      };

      const result = await service.create(createDto);

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.finishDate).toBeInstanceOf(Date);
    });
  });

  describe('findAll', () => {
    it('should return all user book list entries', async () => {
      await service.create({ userId: 1, bookId: 1 });
      await service.create({ userId: 1, bookId: 2 });
      await service.create({ userId: 2, bookId: 1 });

      const result = await service.findAll();

      expect(result).toHaveLength(3);
    });

    it('should return empty array when no entries exist', async () => {
      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user book list entry by id', async () => {
      const entry = await service.create({
        userId: 1,
        bookId: 1,
        status: ListStatus.completed,
      });

      const result = await service.findOne(entry.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(entry.id);
      expect(result.status).toBe(ListStatus.completed);
    });

    it('should throw NotFoundException when entry does not exist', async () => {
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'UserBookList with ID 999 not found',
      );
    });
  });

  describe('findByUser', () => {
    it('should return all entries for a specific user', async () => {
      await service.create({ userId: 1, bookId: 1 });
      await service.create({ userId: 1, bookId: 2 });
      await service.create({ userId: 2, bookId: 1 });

      const result = await service.findByUser(1);

      expect(result).toHaveLength(2);
      expect(result.every((entry) => entry.userId === 1)).toBeTruthy();
    });

    it('should return empty array when user has no entries', async () => {
      const result = await service.findByUser(999);

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a user book list entry successfully', async () => {
      const entry = await service.create({
        userId: 1,
        bookId: 1,
        status: ListStatus.reading,
        rating: 3,
      });

      const updateDto = {
        status: ListStatus.completed,
        rating: 5,
        progress: 100,
        finishDate: '2024-02-01',
      };

      const result = await service.update(entry.id, updateDto);

      expect(result.status).toBe(updateDto.status);
      expect(result.rating).toBe(updateDto.rating);
      expect(result.progress).toBe(updateDto.progress);
    });

    it('should throw NotFoundException when updating non-existent entry', async () => {
      await expect(
        service.update(999, { status: ListStatus.completed }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should call updateBookStatistics when rating changes', async () => {
      const entry = await service.create({
        userId: 1,
        bookId: 1,
        rating: 3,
      });

      const updateStatsSpy = jest.spyOn(bookRepository, 'updateBookStatistics');

      await service.update(entry.id, { rating: 5 });

      expect(updateStatsSpy).toHaveBeenCalledWith(
        1,
        BookStatisticsOperation.UPDATE,
        3,
        5,
      );
    });

    it('should not call updateBookStatistics when rating is not updated', async () => {
      const entry = await service.create({
        userId: 1,
        bookId: 1,
        status: ListStatus.reading,
      });

      const updateStatsSpy = jest.spyOn(bookRepository, 'updateBookStatistics');
      updateStatsSpy.mockClear();

      await service.update(entry.id, { status: ListStatus.completed });

      expect(updateStatsSpy).not.toHaveBeenCalled();
    });

    it('should update only specified fields', async () => {
      const entry = await service.create({
        userId: 1,
        bookId: 1,
        status: ListStatus.reading,
        rating: 4,
        progress: 50,
      });

      const result = await service.update(entry.id, {
        progress: 75,
      });

      expect(result.progress).toBe(75);
      // Verifica que os campos não atualizados permanecem
      const updatedEntry = await service.findOne(entry.id);
      expect(updatedEntry.status).toBe(ListStatus.reading);
      expect(updatedEntry.rating).toBe(4);
    });
  });

  describe('remove', () => {
    it('should remove a user book list entry successfully', async () => {
      const entry = await service.create({
        userId: 1,
        bookId: 1,
        rating: 4,
      });

      const updateStatsSpy = jest.spyOn(bookRepository, 'updateBookStatistics');

      await service.remove(entry.id);

      expect(updateStatsSpy).toHaveBeenCalledWith(
        1,
        BookStatisticsOperation.REMOVE,
        4,
      );

      await expect(service.findOne(entry.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when removing non-existent entry', async () => {
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should call updateBookStatistics even without rating', async () => {
      const entry = await service.create({
        userId: 1,
        bookId: 1,
      });

      const updateStatsSpy = jest.spyOn(bookRepository, 'updateBookStatistics');

      await service.remove(entry.id);

      expect(updateStatsSpy).toHaveBeenCalledWith(
        1,
        BookStatisticsOperation.REMOVE,
        null,
      );
    });
  });
});
