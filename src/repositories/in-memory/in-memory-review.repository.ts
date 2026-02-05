import { Injectable } from '@nestjs/common';
import { Review } from '@prisma/client';
import { IReviewRepository } from '../interfaces/review.repository.interface';

@Injectable()
export class InMemoryReviewRepository implements IReviewRepository {
  private reviews: Review[] = [];
  private currentId = 1;

  async create(data: {
    userId: number;
    bookId: number;
    rating?: number;
    title?: string;
    content?: string;
  }): Promise<Review> {
    const review: Review = {
      id: this.currentId++,
      userId: data.userId,
      bookId: data.bookId,
      rating: data.rating || null,
      title: data.title || null,
      content: data.content || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.reviews.push(review);
    return review;
  }

  async findAll(): Promise<Review[]> {
    return [...this.reviews].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async findOne(id: number): Promise<Review | null> {
    return this.reviews.find((review) => review.id === id) || null;
  }

  async findByBook(bookId: number): Promise<Review[]> {
    return this.reviews
      .filter((review) => review.bookId === bookId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findByUser(userId: number): Promise<Review[]> {
    return this.reviews
      .filter((review) => review.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async update(
    id: number,
    data: {
      rating?: number;
      title?: string;
      content?: string;
    },
  ): Promise<Review> {
    const index = this.reviews.findIndex((review) => review.id === id);

    if (index === -1) {
      throw new Error('Review not found');
    }

    this.reviews[index] = {
      ...this.reviews[index],
      ...data,
      updatedAt: new Date(),
    };

    return this.reviews[index];
  }

  async delete(id: number): Promise<void> {
    const index = this.reviews.findIndex((review) => review.id === id);

    if (index === -1) {
      throw new Error('Review not found');
    }

    this.reviews.splice(index, 1);
  }
}
