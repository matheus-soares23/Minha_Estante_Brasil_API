import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { BooksModule } from '../books.module';
import { AuthorsModule } from '../../authors/authors.module';
import { GenresModule } from '../../genres/genres.module';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import {
  BOOK_REPOSITORY,
  AUTHOR_REPOSITORY,
  GENRE_REPOSITORY,
  USER_REPOSITORY,
} from '../../../repositories/tokens';
import {
  InMemoryBookRepository,
  InMemoryAuthorRepository,
  InMemoryGenreRepository,
  InMemoryUserRepository,
} from '../../../repositories/in-memory';
import { BookType } from '@prisma/client';

describe('BooksController (integration)', () => {
  let app: INestApplication;
  let accessToken: string;
  let authorId: number;
  let genreId: number;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        BooksModule,
        AuthorsModule,
        GenresModule,
        AuthModule,
        UsersModule,
      ],
    })
      .overrideProvider(BOOK_REPOSITORY)
      .useClass(InMemoryBookRepository)
      .overrideProvider(AUTHOR_REPOSITORY)
      .useClass(InMemoryAuthorRepository)
      .overrideProvider(GENRE_REPOSITORY)
      .useClass(InMemoryGenreRepository)
      .overrideProvider(USER_REPOSITORY)
      .useClass(InMemoryUserRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Criar usuário e fazer login
    await request(app.getHttpServer()).post('/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

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
        name: 'Machado de Assis',
      });

    authorId = authorResponse.body.id;

    const genreResponse = await request(app.getHttpServer())
      .post('/genres')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Romance',
      });

    genreId = genreResponse.body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/books (POST)', () => {
    it('should create a new book', () => {
      return request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Sense Life',
          synopsis: 'História de Kaleb',
          type: BookType.novel,
          authors: [{ authorId: authorId }],
          genreIds: [genreId],
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.title).toBe('Sense Life');
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Sense Life',
        })
        .expect(401);
    });

    it('should return 400 with invalid data', () => {
      return request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'invalid-type',
        })
        .expect(400);
    });
  });

  describe('/books (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Betiger',
          type: BookType.novel,
          authors: [{ authorId: authorId }],
        });

      await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '48Km',
          type: BookType.novel,
          authors: [{ authorId: authorId }],
        });
    });

    it('should return all books', () => {
      return request(app.getHttpServer())
        .get('/books')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThanOrEqual(2);
        });
    });

    it('should filter books by title', () => {
      return request(app.getHttpServer())
        .get('/books?title=Quincas')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });
  });

  describe('/books/:id (GET)', () => {
    let bookId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Pecado Vivo',
          synopsis: 'História de suspense',
          type: BookType.novel,
          authors: [{ authorId: authorId }],
        });

      bookId = response.body.id;
    });

    it('should return a book by id', () => {
      return request(app.getHttpServer())
        .get(`/books/${bookId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(bookId);
          expect(response.body.title).toBe('Pecado Vivo');
        });
    });

    it('should return 404 when book not found', () => {
      return request(app.getHttpServer()).get('/books/999').expect(404);
    });
  });

  describe('/books/author/:authorId (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Livro do Autor',
          type: BookType.novel,
          authors: [{ authorId: authorId }],
        });
    });

    it('should return books by author', () => {
      return request(app.getHttpServer())
        .get(`/books/author/${authorId}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/books/:id (PUT)', () => {
    let bookId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Livro Original',
          type: BookType.novel,
          authors: [{ authorId: authorId }],
        });

      bookId = response.body.id;
    });

    it('should update a book', () => {
      return request(app.getHttpServer())
        .put(`/books/${bookId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Livro Atualizado',
          synopsis: 'Nova sinopse',
        })
        .expect(200)
        .then((response) => {
          expect(response.body.title).toBe('Livro Atualizado');
          expect(response.body.synopsis).toBe('Nova sinopse');
        });
    });

    it('should return 404 when book not found', () => {
      return request(app.getHttpServer())
        .put('/books/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated',
        })
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .put(`/books/${bookId}`)
        .send({
          title: 'Updated',
        })
        .expect(401);
    });
  });

  describe('/books/:id (DELETE)', () => {
    let bookId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Livro para Deletar',
          type: BookType.novel,
          authors: [{ authorId: authorId }],
        });

      bookId = response.body.id;
    });

    it('should delete a book', () => {
      return request(app.getHttpServer())
        .delete(`/books/${bookId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should return 404 when book not found', () => {
      return request(app.getHttpServer())
        .delete('/books/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/books/${bookId}`)
        .expect(401);
    });
  });
});
