import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UserBookListModule } from '../user-book-list.module';
import { BooksModule } from '../../books/books.module';
import { AuthorsModule } from '../../authors/authors.module';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import {
  USER_BOOK_LIST_REPOSITORY,
  BOOK_REPOSITORY,
  AUTHOR_REPOSITORY,
  USER_REPOSITORY,
} from '../../../repositories/tokens';
import {
  InMemoryUserBookListRepository,
  InMemoryBookRepository,
  InMemoryAuthorRepository,
  InMemoryUserRepository,
} from '../../../repositories/in-memory';
import { BookType, ListStatus } from '@prisma/client';

describe('UserBookListController (integration)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: number;
  let bookId: number;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        UserBookListModule,
        BooksModule,
        AuthorsModule,
        AuthModule,
        UsersModule,
      ],
    })
      .overrideProvider(USER_BOOK_LIST_REPOSITORY)
      .useClass(InMemoryUserBookListRepository)
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

  describe('/user-book-list (POST)', () => {
    it('should add a book to user list', () => {
      return request(app.getHttpServer())
        .post('/user-book-list')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          bookId: bookId,
          status: ListStatus.reading,
          rating: 8,
          progress: 50,
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.userId).toBe(userId);
          expect(response.body.bookId).toBe(bookId);
          expect(response.body.status).toBe(ListStatus.reading);
          expect(response.body.rating).toBe(8);
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/user-book-list')
        .send({
          userId: userId,
          bookId: bookId,
          status: ListStatus.reading,
        })
        .expect(401);
    });

    it('should return 400 with invalid data', () => {
      return request(app.getHttpServer())
        .post('/user-book-list')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: 'invalid',
          bookId: bookId,
        })
        .expect(400);
    });

    it('should return 400 when rating is out of range', () => {
      return request(app.getHttpServer())
        .post('/user-book-list')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          bookId: bookId,
          rating: 11,
        })
        .expect(400);
    });
  });

  describe('/user-book-list (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/user-book-list')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          bookId: bookId,
          status: ListStatus.completed,
        });
    });

    it('should return all user book list entries', () => {
      return request(app.getHttpServer())
        .get('/user-book-list')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get('/user-book-list').expect(401);
    });
  });

  describe('/user-book-list/:id (GET)', () => {
    let entryId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/user-book-list')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          bookId: bookId,
          status: ListStatus.planned,
        });

      entryId = response.body.id;
    });

    it('should return a user book list entry by id', () => {
      return request(app.getHttpServer())
        .get(`/user-book-list/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(entryId);
          expect(response.body.status).toBe(ListStatus.planned);
        });
    });

    it('should return 404 when entry not found', () => {
      return request(app.getHttpServer())
        .get('/user-book-list/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get(`/user-book-list/${entryId}`)
        .expect(401);
    });
  });

  describe('/user-book-list/user/:userId (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/user-book-list')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          bookId: bookId,
          status: ListStatus.reading,
        });
    });

    it('should return user book list by user', () => {
      return request(app.getHttpServer())
        .get(`/user-book-list/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get(`/user-book-list/user/${userId}`)
        .expect(401);
    });
  });

  describe('/user-book-list/:id (PATCH)', () => {
    let entryId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/user-book-list')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          bookId: bookId,
          status: ListStatus.reading,
          progress: 30,
        });

      entryId = response.body.id;
    });

    it('should update a user book list entry', () => {
      return request(app.getHttpServer())
        .patch(`/user-book-list/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: ListStatus.completed,
          rating: 9,
          progress: 100,
        })
        .expect(200)
        .then((response) => {
          expect(response.body.status).toBe(ListStatus.completed);
          expect(response.body.rating).toBe(9);
          expect(response.body.progress).toBe(100);
        });
    });

    it('should return 404 when entry not found', () => {
      return request(app.getHttpServer())
        .patch('/user-book-list/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: ListStatus.completed,
        })
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/user-book-list/${entryId}`)
        .send({
          status: ListStatus.completed,
        })
        .expect(401);
    });
  });

  describe('/user-book-list/:id (DELETE)', () => {
    let entryId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/user-book-list')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          bookId: bookId,
          status: ListStatus.dropped,
        });

      entryId = response.body.id;
    });

    it('should delete a user book list entry', () => {
      return request(app.getHttpServer())
        .delete(`/user-book-list/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should return 404 when entry not found', () => {
      return request(app.getHttpServer())
        .delete('/user-book-list/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/user-book-list/${entryId}`)
        .expect(401);
    });
  });
});
