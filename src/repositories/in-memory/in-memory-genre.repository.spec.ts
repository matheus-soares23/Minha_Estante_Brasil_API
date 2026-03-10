import { InMemoryGenreRepository } from './in-memory-genre.repository';

describe('InMemoryGenreRepository', () => {
  let repository: InMemoryGenreRepository;

  beforeEach(() => {
    repository = new InMemoryGenreRepository();
  });

  describe('findBySlug', () => {
    it('should return null when slug not found', async () => {
      const result = await repository.findBySlug('nonexistent');

      expect(result).toBeNull();
    });

    it('should return genre by slug', async () => {
      await repository.create({
        name: 'Fantasy',
        slug: 'fantasy',
      });

      const result = await repository.findBySlug('fantasy');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('fantasy');
    });
  });

  describe('update', () => {
    it('should throw error when updating non-existent genre', async () => {
      await expect(repository.update(999, { name: 'Test' })).rejects.toThrow(
        'Genre not found',
      );
    });
  });

  describe('delete', () => {
    it('should throw error when deleting non-existent genre', async () => {
      await expect(repository.delete(999)).rejects.toThrow('Genre not found');
    });
  });
});
