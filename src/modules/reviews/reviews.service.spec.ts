import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { InMemoryReviewRepository } from '../../repositories/in-memory';
import { REVIEW_REPOSITORY } from '../../repositories/tokens';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let repository: InMemoryReviewRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: REVIEW_REPOSITORY,
          useClass: InMemoryReviewRepository,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    repository = module.get<InMemoryReviewRepository>(REVIEW_REPOSITORY);
  });

  afterEach(() => {
    // Limpar dados entre testes
    repository['reviews'] = [];
    repository['currentId'] = 1;
  });

  describe('create', () => {
    it('should create a review successfully', async () => {
      const createReviewDto = {
        userId: 1,
        bookId: 1,
        title: 'Great Book',
        content: 'This book is amazing!',
      };

      const result = await service.create(createReviewDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.userId).toBe(createReviewDto.userId);
      expect(result.bookId).toBe(createReviewDto.bookId);
      expect(result.title).toBe(createReviewDto.title);
      expect(result.content).toBe(createReviewDto.content);
    });

    it('should create a review without title', async () => {
      const createReviewDto = {
        userId: 1,
        bookId: 1,
        content: 'This book is amazing!',
      };

      const result = await service.create(createReviewDto);

      expect(result).toBeDefined();
      expect(result.title).toBeNull();
      expect(result.content).toBe(createReviewDto.content);
    });
  });

  describe('findAll', () => {
    it('should return all reviews', async () => {
      await service.create({
        userId: 1,
        bookId: 1,
        title: 'Review 1',
        content: 'Content 1',
      });
      await service.create({
        userId: 2,
        bookId: 2,
        title: 'Review 2',
        content: 'Content 2',
      });

      const result = await service.findAll();

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no reviews exist', async () => {
      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a review by id', async () => {
      const review = await service.create({
        userId: 1,
        bookId: 1,
        title: 'Review 1',
        content: 'Content 1',
      });

      const result = await service.findOne(review.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(review.id);
    });

    it('should throw NotFoundException when review does not exist', async () => {
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Review with ID 999 not found',
      );
    });
  });

  describe('findByBook', () => {
    it('should return all reviews for a book', async () => {
      await service.create({
        userId: 1,
        bookId: 1,
        title: 'Review 1',
        content: 'Content 1',
      });
      await service.create({
        userId: 2,
        bookId: 1,
        title: 'Review 2',
        content: 'Content 2',
      });
      await service.create({
        userId: 3,
        bookId: 2,
        title: 'Review 3',
        content: 'Content 3',
      });

      const result = await service.findByBook(1);

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.bookId === 1)).toBeTruthy();
    });

    it('should return empty array when no reviews exist for a book', async () => {
      const result = await service.findByBook(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByUser', () => {
    it('should return all reviews by a user', async () => {
      await service.create({
        userId: 1,
        bookId: 1,
        title: 'Review 1',
        content: 'Content 1',
      });
      await service.create({
        userId: 1,
        bookId: 2,
        title: 'Review 2',
        content: 'Content 2',
      });
      await service.create({
        userId: 2,
        bookId: 3,
        title: 'Review 3',
        content: 'Content 3',
      });

      const result = await service.findByUser(1);

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.userId === 1)).toBeTruthy();
    });

    it('should return empty array when user has no reviews', async () => {
      const result = await service.findByUser(999);

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a review successfully', async () => {
      const review = await service.create({
        userId: 1,
        bookId: 1,
        title: 'Original Title',
        content: 'Original Content',
      });

      const updateDto = {
        title: 'Updated Title',
        content: 'Updated Content',
      };

      const result = await service.update(review.id, updateDto);

      expect(result.title).toBe(updateDto.title);
      expect(result.content).toBe(updateDto.content);
    });

    it('should throw NotFoundException when updating non-existent review', async () => {
      await expect(
        service.update(999, { title: 'Test', content: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only specified fields', async () => {
      const review = await service.create({
        userId: 1,
        bookId: 1,
        title: 'Original Title',
        content: 'Original Content',
      });

      const result = await service.update(review.id, {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
      // Content permanece o mesmo pois não foi enviado no update
      const updatedReview = await service.findOne(review.id);
      expect(updatedReview.content).toBe('Original Content');
    });
  });

  describe('remove', () => {
    it('should remove a review successfully', async () => {
      const review = await service.create({
        userId: 1,
        bookId: 1,
        title: 'Review to delete',
        content: 'Content',
      });

      await service.remove(review.id);

      await expect(service.findOne(review.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when removing non-existent review', async () => {
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
