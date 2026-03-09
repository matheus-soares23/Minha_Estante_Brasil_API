import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateReviewDto, UpdateReviewDto } from './dto';
import { IReviewRepository } from '../../repositories/interfaces';
import { REVIEW_REPOSITORY } from '../../repositories/tokens';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async create(createReviewDto: CreateReviewDto) {
    const review = await this.reviewRepository.create({
      userId: createReviewDto.userId,
      bookId: createReviewDto.bookId,
      title: createReviewDto.title,
      content: createReviewDto.content,
    });

    return review;
  }

  async findAll() {
    return this.reviewRepository.findAll();
  }

  async findOne(id: number) {
    const review = await this.reviewRepository.findOne(id);

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async findByBook(bookId: number) {
    return this.reviewRepository.findByBook(bookId);
  }

  async findByUser(userId: number) {
    return this.reviewRepository.findByUser(userId);
  }

  async update(id: number, updateReviewDto: UpdateReviewDto) {
    await this.findOne(id);

    const updatedReview = await this.reviewRepository.update(id, {
      title: updateReviewDto.title,
      content: updateReviewDto.content,
    });

    return updatedReview;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.reviewRepository.delete(id);
  }
}
