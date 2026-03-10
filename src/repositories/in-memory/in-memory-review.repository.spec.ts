import { InMemoryReviewRepository } from './in-memory-review.repository';

describe('InMemoryReviewRepository', () => {
  let repository: InMemoryReviewRepository;

  beforeEach(() => {
    repository = new InMemoryReviewRepository();
  });

  describe('update', () => {
    it('should throw error when updating non-existent review', async () => {
      await expect(
        repository.update(999, { title: 'Test' }),
      ).rejects.toThrow('Review not found');
    });
  });

  describe('delete', () => {
    it('should throw error when deleting non-existent review', async () => {
      await expect(repository.delete(999)).rejects.toThrow('Review not found');
    });
  });
});
