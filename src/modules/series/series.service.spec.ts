import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SeriesService } from './series.service';
import { InMemorySeriesRepository } from '../../repositories/in-memory';
import { SERIES_REPOSITORY } from '../../repositories/tokens';

describe('SeriesService', () => {
  let service: SeriesService;
  let repository: InMemorySeriesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeriesService,
        {
          provide: SERIES_REPOSITORY,
          useClass: InMemorySeriesRepository,
        },
      ],
    }).compile();

    service = module.get<SeriesService>(SeriesService);
    repository = module.get<InMemorySeriesRepository>(SERIES_REPOSITORY);
  });

  afterEach(() => {
    repository['series'] = [];
    repository['currentId'] = 1;
  });

  describe('create', () => {
    it('should create a series successfully', async () => {
      const createSeriesDto = {
        name: 'Harry Potter',
        description: 'Wizarding World Series',
        slug: 'harry-potter',
      };

      const result = await service.create(createSeriesDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe(createSeriesDto.name);
      expect(result.description).toBe(createSeriesDto.description);
      expect(result.slug).toBe(createSeriesDto.slug);
    });

    it('should create a series without optional fields', async () => {
      const createSeriesDto = {
        name: 'The Lord of the Rings',
      };

      const result = await service.create(createSeriesDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createSeriesDto.name);
      expect(result.description).toBeNull();
      expect(result.slug).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all series sorted by name', async () => {
      await service.create({ name: 'Throne of Glass' });
      await service.create({ name: 'A Court of Thorns and Roses' });
      await service.create({ name: 'Percy Jackson' });

      const result = await service.findAll();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('A Court of Thorns and Roses');
      expect(result[1].name).toBe('Percy Jackson');
      expect(result[2].name).toBe('Throne of Glass');
    });

    it('should return empty array when no series exist', async () => {
      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a series by id', async () => {
      const series = await service.create({
        name: 'The Hunger Games',
        description: 'Dystopian trilogy',
      });

      const result = await service.findOne(series.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(series.id);
      expect(result.name).toBe(series.name);
    });

    it('should throw NotFoundException when series does not exist', async () => {
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Series with ID 999 not found',
      );
    });
  });

  describe('update', () => {
    it('should update a series successfully', async () => {
      const series = await service.create({
        name: 'Original Name',
        description: 'Original Description',
        slug: 'original',
      });

      const updateDto = {
        name: 'Updated Name',
        description: 'Updated Description',
        slug: 'updated',
      };

      const result = await service.update(series.id, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(result.description).toBe(updateDto.description);
      expect(result.slug).toBe(updateDto.slug);
    });

    it('should throw NotFoundException when updating non-existent series', async () => {
      await expect(
        service.update(999, { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only specified fields', async () => {
      const series = await service.create({
        name: 'Original Name',
        description: 'Original Description',
        slug: 'original',
      });

      const result = await service.update(series.id, {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      // Verifica que os campos não atualizados permanecem
      const updatedSeries = await service.findOne(series.id);
      expect(updatedSeries.description).toBe('Original Description');
      expect(updatedSeries.slug).toBe('original');
    });
  });

  describe('remove', () => {
    it('should remove a series successfully', async () => {
      const series = await service.create({
        name: 'Series to delete',
      });

      await service.remove(series.id);

      await expect(service.findOne(series.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when removing non-existent series', async () => {
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
