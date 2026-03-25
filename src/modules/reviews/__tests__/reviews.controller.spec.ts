import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ReviewsModule } from '../reviews.module';
import { BooksModule } from '../../books/books.module';
import { AuthorsModule } from '../../authors/authors.module';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import {
  REVIEW_REPOSITORY,
  BOOK_REPOSITORY,
  AUTHOR_REPOSITORY,
  USER_REPOSITORY,
} from '../../../repositories/tokens';
import {
  InMemoryReviewRepository,
  InMemoryBookRepository,
  InMemoryAuthorRepository,
  InMemoryUserRepository,
} from '../../../repositories/in-memory';
import { BookType } from '@prisma/client';

describe('ReviewsController (integration)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: number;
  let bookId: number;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ReviewsModule, BooksModule, AuthorsModule, AuthModule, UsersModule],
    })
      .overrideProvider(REVIEW_REPOSITORY)
      .useClass(InMemoryReviewRepository)
      .overrideProvider(BOOK_REPOSITORY)
      .useClass(InMemoryBookRepository)
      .overrideProvider(AUTHOR_REPOSITORY)
      .useClass(InMemoryAuthorRepository)
      .overrideProvider(USER_REPOSITORY)
      .useClass(InMemoryUserRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Criar usuário e fazer login
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

    userId = registerResponse.body.user.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login: 'testuser',
        password: 'password123',
      });

    accessToken = loginResponse.body.accessToken;

    const authorResponse = await request(app.getHttpServer())
      .post('/authors')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Autor Teste',
      });

    const bookResponse = await request(app.getHttpServer())
      .post('/books')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Livro Teste',
        type: BookType.novel,
        authors: [{ authorId: authorResponse.body.id }],
      });

    bookId = bookResponse.body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/reviews (POST)', () => {
    it('should create a new review', () => {
      return request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          bookId: bookId,
          title: 'Ótimo livro',
          content: 'Adorei a narrativa e os personagens',
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.title).toBe('Ótimo livro');
          expect(response.body.userId).toBe(userId);
          expect(response.body.bookId).toBe(bookId);
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/reviews')
        .send({
          userId: userId,
          bookId: bookId,
          title: 'Ótimo livro',
        })
        .expect(401);
    });

    it('should return 400 with invalid data', () => {
      return request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: 'invalid',
          bookId: bookId,
        })
        .expect(400);
    });
  });

  describe('/reviews (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          bookId: bookId,
          title: 'Review 1',
        });

      await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          bookId: bookId,
          title: 'Review 2',
        });
    });

    it('should return all reviews', () => {
      return request(app.getHttpServer())
        .get('/reviews')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThanOrEqual(2);
        });
    });
  });

  describe('/reviews/:id (GET)', () => {
    let reviewId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          bookId: bookId,
          title: 'Review Específica',
          content: 'Conteúdo da review',
        });

      reviewId = response.body.id;
    });

    it('should return a review by id', () => {
      return request(app.getHttpServer())
        .get(`/reviews/${reviewId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(reviewId);
          expect(response.body.title).toBe('Review Específica');
        });
    });

    it('should return 404 when review not found', () => {
      return request(app.getHttpServer()).get('/reviews/999').expect(404);
    });
  });

  describe('/reviews/book/:bookId (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          bookId: bookId,
          title: 'Review do Livro',
        });
    });

    it('should return reviews by book', () => {
      return request(app.getHttpServer())
        .get(`/reviews/book/${bookId}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/reviews/user/:userId (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          bookId: bookId,
          title: 'Review do Usuário',
        });
    });

    it('should return reviews by user', () => {
      return request(app.getHttpServer())
        .get(`/reviews/user/${userId}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/reviews/:id (PATCH)', () => {
    let reviewId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          bookId: bookId,
          title: 'Review Original',
        });

      reviewId = response.body.id;
    });

    it('should update a review', () => {
      return request(app.getHttpServer())
        .patch(`/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Review Atualizada',
          content: 'Conteúdo atualizado',
        })
        .expect(200)
        .then((response) => {
          expect(response.body.title).toBe('Review Atualizada');
          expect(response.body.content).toBe('Conteúdo atualizado');
        });
    });

    it('should return 404 when review not found', () => {
      return request(app.getHttpServer())
        .patch('/reviews/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated',
        })
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/reviews/${reviewId}`)
        .send({
          title: 'Updated',
        })
        .expect(401);
    });
  });

  describe('/reviews/:id (DELETE)', () => {
    let reviewId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          bookId: bookId,
          title: 'Review para Deletar',
        });

      reviewId = response.body.id;
    });

    it('should delete a review', () => {
      return request(app.getHttpServer())
        .delete(`/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should return 404 when review not found', () => {
      return request(app.getHttpServer())
        .delete('/reviews/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/reviews/${reviewId}`)
        .expect(401);
    });
  });
});
