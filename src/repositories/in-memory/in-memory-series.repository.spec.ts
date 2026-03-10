import { InMemorySeriesRepository } from './in-memory-series.repository';

describe('InMemorySeriesRepository', () => {
  let repository: InMemorySeriesRepository;

  beforeEach(() => {
    repository = new InMemorySeriesRepository();
  });

  describe('findBySlug', () => {
    it('should return null when slug not found', async () => {
      const result = await repository.findBySlug('nonexistent');

      expect(result).toBeNull();
    });

    it('should return series by slug', async () => {
      await repository.create({
        name: 'Harry Potter',
        slug: 'harry-potter',
      });

      const result = await repository.findBySlug('harry-potter');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('harry-potter');
    });
  });

  describe('update', () => {
    it('should throw error when updating non-existent series', async () => {
      await expect(repository.update(999, { name: 'Test' })).rejects.toThrow(
        'Series not found',
      );
    });
  });

  describe('delete', () => {
    it('should throw error when deleting non-existent series', async () => {
      await expect(repository.delete(999)).rejects.toThrow('Series not found');
    });
  });
});
