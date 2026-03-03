import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateReviewDto, UpdateReviewDto } from './dto';
import {
  IReviewRepository,
  IBookRepository,
  BookStatisticsOperation,
} from '../../repositories/interfaces';
import { REVIEW_REPOSITORY, BOOK_REPOSITORY } from '../../repositories/tokens';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
    @Inject(BOOK_REPOSITORY)
    private readonly bookRepository: IBookRepository,
  ) {}

  async create(createReviewDto: CreateReviewDto) {
    const review = await this.reviewRepository.create({
      userId: createReviewDto.userId,
      bookId: createReviewDto.bookId,
      rating: createReviewDto.rating,
      title: createReviewDto.title,
      content: createReviewDto.content,
    });

    // Review afeta apenas ratings, não popularidade. Usa método incremental.
    await this.bookRepository.updateBookStatistics(
      createReviewDto.bookId,
      BookStatisticsOperation.ADD,
      undefined,
      createReviewDto.rating,
    );
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
    const review = await this.findOne(id);

    const updatedReview = await this.reviewRepository.update(id, {
      rating: updateReviewDto.rating,
      title: updateReviewDto.title,
      content: updateReviewDto.content,
    });

    // Review: atualização incremental do rating
    await this.bookRepository.updateBookStatistics(
      review.bookId,
      BookStatisticsOperation.UPDATE,
      review.rating,
      updateReviewDto.rating,
    );
    return updatedReview;
  }

  async remove(id: number) {
    const review = await this.findOne(id);
    await this.reviewRepository.delete(id);
    // Review: remoção incremental do rating
    await this.bookRepository.updateBookStatistics(
      review.bookId,
      BookStatisticsOperation.REMOVE,
      review.rating,
    );
  }
}
