import { InMemoryUserBookListRepository } from './in-memory-user-book-list.repository';
import { ListStatus } from '@prisma/client';

describe('InMemoryUserBookListRepository', () => {
  let repository: InMemoryUserBookListRepository;

  beforeEach(() => {
    repository = new InMemoryUserBookListRepository();
  });

  describe('findByUserAndBook', () => {
    it('should return null when not found', async () => {
      const result = await repository.findByUserAndBook(1, 1);

      expect(result).toBeNull();
    });

    it('should return entry when found', async () => {
      await repository.create({
        userId: 1,
        bookId: 1,
        status: ListStatus.reading,
      });

      const result = await repository.findByUserAndBook(1, 1);

      expect(result).toBeDefined();
      expect(result?.userId).toBe(1);
      expect(result?.bookId).toBe(1);
    });
  });

  describe('update', () => {
    it('should throw error when updating non-existent entry', async () => {
      await expect(
        repository.update(999, { status: ListStatus.completed }),
      ).rejects.toThrow('UserBookList not found');
    });
  });

  describe('delete', () => {
    it('should throw error when deleting non-existent entry', async () => {
      await expect(repository.delete(999)).rejects.toThrow(
        'UserBookList not found',
      );
    });
  });
});
