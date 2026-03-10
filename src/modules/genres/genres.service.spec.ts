import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GenresService } from './genres.service';
import { InMemoryGenreRepository } from '../../repositories/in-memory';
import { GENRE_REPOSITORY } from '../../repositories/tokens';

describe('GenresService', () => {
  let service: GenresService;
  let repository: InMemoryGenreRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenresService,
        {
          provide: GENRE_REPOSITORY,
          useClass: InMemoryGenreRepository,
        },
      ],
    }).compile();

    service = module.get<GenresService>(GenresService);
    repository = module.get<InMemoryGenreRepository>(GENRE_REPOSITORY);
  });

  afterEach(() => {
    repository['genres'] = [];
    repository['currentId'] = 1;
  });

  describe('create', () => {
    it('should create a genre successfully', async () => {
      const createGenreDto = {
        name: 'Romance',
        description: 'Romantic novels',
        slug: 'romance',
      };

      const result = await service.create(createGenreDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe(createGenreDto.name);
      expect(result.description).toBe(createGenreDto.description);
      expect(result.slug).toBe(createGenreDto.slug);
    });

    it('should create a genre without optional fields', async () => {
      const createGenreDto = {
        name: 'Fantasy',
      };

      const result = await service.create(createGenreDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createGenreDto.name);
      expect(result.description).toBeNull();
      expect(result.slug).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all genres sorted by name', async () => {
      await service.create({ name: 'Thriller' });
      await service.create({ name: 'Adventure' });
      await service.create({ name: 'Mystery' });

      const result = await service.findAll();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Adventure');
      expect(result[1].name).toBe('Mystery');
      expect(result[2].name).toBe('Thriller');
    });

    it('should return empty array when no genres exist', async () => {
      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a genre by id', async () => {
      const genre = await service.create({
        name: 'Science Fiction',
        description: 'Futuristic stories',
      });

      const result = await service.findOne(genre.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(genre.id);
      expect(result.name).toBe(genre.name);
    });

    it('should throw NotFoundException when genre does not exist', async () => {
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Genre with ID 999 not found',
      );
    });
  });

  describe('update', () => {
    it('should update a genre successfully', async () => {
      const genre = await service.create({
        name: 'Original Name',
        description: 'Original Description',
        slug: 'original',
      });

      const updateDto = {
        name: 'Updated Name',
        description: 'Updated Description',
        slug: 'updated',
      };

      const result = await service.update(genre.id, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(result.description).toBe(updateDto.description);
      expect(result.slug).toBe(updateDto.slug);
    });

    it('should throw NotFoundException when updating non-existent genre', async () => {
      await expect(
        service.update(999, { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only specified fields', async () => {
      const genre = await service.create({
        name: 'Original Name',
        description: 'Original Description',
        slug: 'original',
      });

      const result = await service.update(genre.id, {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      // Verifica que os campos não atualizados permanecem
      const updatedGenre = await service.findOne(genre.id);
      expect(updatedGenre.description).toBe('Original Description');
      expect(updatedGenre.slug).toBe('original');
    });
  });

  describe('remove', () => {
    it('should remove a genre successfully', async () => {
      const genre = await service.create({
        name: 'Genre to delete',
      });

      await service.remove(genre.id);

      await expect(service.findOne(genre.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when removing non-existent genre', async () => {
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
