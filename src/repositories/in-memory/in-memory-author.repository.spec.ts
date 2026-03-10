import { InMemoryAuthorRepository } from './in-memory-author.repository';

describe('InMemoryAuthorRepository', () => {
  let repository: InMemoryAuthorRepository;

  beforeEach(() => {
    repository = new InMemoryAuthorRepository();
  });

  describe('create', () => {
    it('should create an author with all fields', () => {
      const data = {
        name: 'Machado de Assis',
        biography: 'Famous Brazilian writer',
        birthDate: new Date('1839-06-21'),
        deathDate: new Date('1908-09-29'),
        image: 'machado.jpg',
      };

      const author = repository.create(data);

      expect(author).resolves.toMatchObject({
        id: 1,
        name: data.name,
        biography: data.biography,
        birthDate: data.birthDate,
        deathDate: data.deathDate,
        image: data.image,
      });
    });

    it('should create an author without optional fields', async () => {
      const data = { name: 'Clarice Lispector' };

      const author = await repository.create(data);

      expect(author.name).toBe(data.name);
      expect(author.biography).toBeNull();
      expect(author.birthDate).toBeNull();
      expect(author.deathDate).toBeNull();
      expect(author.image).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return null for non-existent author', async () => {
      const result = await repository.findOne(999);

      expect(result).toBeNull();
    });

    it('should return author with books array', async () => {
      const author = await repository.create({ name: 'Test Author' });
      const result = await repository.findOne(author.id);

      expect(result).toBeDefined();
      expect(result?.books).toEqual([]);
    });
  });

  describe('update', () => {
    it('should throw error when updating non-existent author', async () => {
      await expect(repository.update(999, { name: 'Test' })).rejects.toThrow(
        'Author not found',
      );
    });

    it('should preserve fields not provided in update', async () => {
      const author = await repository.create({
        name: 'Original',
        biography: 'Bio',
        image: 'image.jpg',
      });

      const updated = await repository.update(author.id, {
        name: 'Updated',
      });

      expect(updated.name).toBe('Updated');
      expect(updated.biography).toBe('Bio');
      expect(updated.image).toBe('image.jpg');
    });
  });

  describe('delete', () => {
    it('should throw error when deleting non-existent author', async () => {
      await expect(repository.delete(999)).rejects.toThrow('Author not found');
    });
  });
});
