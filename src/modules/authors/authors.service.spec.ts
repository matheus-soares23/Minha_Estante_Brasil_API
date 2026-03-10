import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { InMemoryAuthorRepository } from '../../repositories/in-memory';
import { AUTHOR_REPOSITORY } from '../../repositories/tokens';

describe('AuthorsService', () => {
  let service: AuthorsService;
  let repository: InMemoryAuthorRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        {
          provide: AUTHOR_REPOSITORY,
          useClass: InMemoryAuthorRepository,
        },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
    repository = module.get<InMemoryAuthorRepository>(AUTHOR_REPOSITORY);
  });

  afterEach(() => {
    repository['authors'] = [];
    repository['currentId'] = 1;
  });

  describe('create', () => {
    it('should create an author successfully', async () => {
      const createAuthorDto = {
        name: 'Machado de Assis',
        biography: 'Famous Brazilian writer',
        birthDate: '1839-06-21',
        deathDate: '1908-09-29',
        image: 'machado.jpg',
      };

      const result = await service.create(createAuthorDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe(createAuthorDto.name);
      expect(result.biography).toBe(createAuthorDto.biography);
      expect(result.image).toBe(createAuthorDto.image);
    });

    it('should create an author without optional fields', async () => {
      const createAuthorDto = {
        name: 'Clarice Lispector',
      };

      const result = await service.create(createAuthorDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createAuthorDto.name);
      expect(result.biography).toBeNull();
      expect(result.birthDate).toBeNull();
      expect(result.deathDate).toBeNull();
      expect(result.image).toBeNull();
    });

    it('should convert date strings to Date objects', async () => {
      const createAuthorDto = {
        name: 'Jorge Amado',
        birthDate: '1912-08-10',
        deathDate: '2001-08-06',
      };

      const result = await service.create(createAuthorDto);

      expect(result.birthDate).toBeInstanceOf(Date);
      expect(result.deathDate).toBeInstanceOf(Date);
    });
  });

  describe('findAll', () => {
    it('should return all authors sorted by name', async () => {
      await service.create({ name: 'Paulo Coelho' });
      await service.create({ name: 'Carlos Drummond de Andrade' });
      await service.create({ name: 'Jorge Amado' });

      const result = await service.findAll();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Carlos Drummond de Andrade');
      expect(result[1].name).toBe('Jorge Amado');
      expect(result[2].name).toBe('Paulo Coelho');
    });

    it('should return empty array when no authors exist', async () => {
      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an author by id', async () => {
      const author = await service.create({
        name: 'Cecília Meireles',
        biography: 'Brazilian poet',
      });

      const result = await service.findOne(author.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(author.id);
      expect(result.name).toBe(author.name);
      expect(result.books).toBeDefined();
    });

    it('should throw NotFoundException when author does not exist', async () => {
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Author with ID 999 not found',
      );
    });
  });

  describe('update', () => {
    it('should update an author successfully', async () => {
      const author = await service.create({
        name: 'Original Name',
        biography: 'Original Biography',
      });

      const updateDto = {
        name: 'Updated Name',
        biography: 'Updated Biography',
        birthDate: '1900-01-01',
        image: 'updated.jpg',
      };

      const result = await service.update(author.id, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(result.biography).toBe(updateDto.biography);
      expect(result.image).toBe(updateDto.image);
    });

    it('should throw NotFoundException when updating non-existent author', async () => {
      await expect(
        service.update(999, { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only specified fields', async () => {
      const author = await service.create({
        name: 'Original Name',
        biography: 'Original Biography',
      });

      const result = await service.update(author.id, {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(result.biography).toBe('Original Biography');
    });

    it('should convert date strings to Date objects when updating', async () => {
      const author = await service.create({
        name: 'Test Author',
      });

      const result = await service.update(author.id, {
        birthDate: '1900-01-01',
      });

      expect(result.birthDate).toBeInstanceOf(Date);
    });
  });

  describe('remove', () => {
    it('should remove an author successfully', async () => {
      const author = await service.create({
        name: 'Author to delete',
      });

      await service.remove(author.id);

      await expect(service.findOne(author.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when removing non-existent author', async () => {
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
