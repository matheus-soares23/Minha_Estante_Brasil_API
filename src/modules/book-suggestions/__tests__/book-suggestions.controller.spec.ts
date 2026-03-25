import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { BookSuggestionsModule } from '../book-suggestions.module';
import { GenresModule } from '../../genres/genres.module';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import {
  BOOK_SUGGESTION_REPOSITORY,
  GENRE_REPOSITORY,
  USER_REPOSITORY,
} from '../../../repositories/tokens';
import {
  InMemoryBookSuggestionRepository,
  InMemoryGenreRepository,
  InMemoryUserRepository,
} from '../../../repositories/in-memory';
import { BookType } from '@prisma/client';

describe('BookSuggestionsController (integration)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: number;
  let genreId: number;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [BookSuggestionsModule, GenresModule, AuthModule, UsersModule],
    })
      .overrideProvider(BOOK_SUGGESTION_REPOSITORY)
      .useClass(InMemoryBookSuggestionRepository)
      .overrideProvider(GENRE_REPOSITORY)
      .useClass(InMemoryGenreRepository)
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

    const genreResponse = await request(app.getHttpServer())
      .post('/genres')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Ficção Científica',
      });

    genreId = genreResponse.body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/book-suggestions (POST)', () => {
    it('should create a new book suggestion', () => {
      return request(app.getHttpServer())
        .post('/book-suggestions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          title: 'Livro Sugerido',
          genreId: genreId,
          type: BookType.novel,
          authors: 'Autor Desconhecido',
          synopsis: 'Uma história interessante',
          pages: 250,
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.title).toBe('Livro Sugerido');
          expect(response.body.userId).toBe(userId);
          expect(response.body.genreId).toBe(genreId);
          expect(response.body.type).toBe(BookType.novel);
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/book-suggestions')
        .send({
          userId: userId,
          title: 'Livro Sugerido',
          genreId: genreId,
          type: BookType.novel,
          authors: 'Autor',
        })
        .expect(401);
    });

    it('should return 400 with invalid data', () => {
      return request(app.getHttpServer())
        .post('/book-suggestions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          title: 'Livro Sugerido',
          genreId: genreId,
          type: 'invalid-type',
          authors: 'Autor',
        })
        .expect(400);
    });

    it('should return 400 when required fields are missing', () => {
      return request(app.getHttpServer())
        .post('/book-suggestions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          title: 'Livro Sugerido',
        })
        .expect(400);
    });
  });

  describe('/book-suggestions (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/book-suggestions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          title: 'Sugestão 1',
          genreId: genreId,
          type: BookType.novel,
          authors: 'Autor 1',
        });

      await request(app.getHttpServer())
        .post('/book-suggestions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          title: 'Sugestão 2',
          genreId: genreId,
          type: BookType.light_novel,
          authors: 'Autor 2',
        });
    });

    it('should return all book suggestions', () => {
      return request(app.getHttpServer())
        .get('/book-suggestions')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThanOrEqual(2);
        });
    });
  });

  describe('/book-suggestions/:id (GET)', () => {
    let suggestionId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/book-suggestions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          title: 'Sugestão Específica',
          genreId: genreId,
          type: BookType.manga,
          authors: 'Mangaká Famoso',
          synopsis: 'Uma história de aventura épica',
        });

      suggestionId = response.body.id;
    });

    it('should return a book suggestion by id', () => {
      return request(app.getHttpServer())
        .get(`/book-suggestions/${suggestionId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(suggestionId);
          expect(response.body.title).toBe('Sugestão Específica');
          expect(response.body.type).toBe(BookType.manga);
        });
    });

    it('should return 404 when suggestion not found', () => {
      return request(app.getHttpServer())
        .get('/book-suggestions/999')
        .expect(404);
    });
  });

  describe('/book-suggestions/user/:userId (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/book-suggestions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          title: 'Sugestão do Usuário',
          genreId: genreId,
          type: BookType.web_novel,
          authors: 'Autor Web',
        });
    });

    it('should return suggestions by user', () => {
      return request(app.getHttpServer())
        .get(`/book-suggestions/user/${userId}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
          expect(response.body[0].userId).toBe(userId);
        });
    });

    it('should return empty array for user with no suggestions', () => {
      return request(app.getHttpServer())
        .get('/book-suggestions/user/999')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBe(0);
        });
    });
  });

  describe('/book-suggestions/:id (DELETE)', () => {
    let suggestionId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/book-suggestions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          title: 'Sugestão para Deletar',
          genreId: genreId,
          type: BookType.anthology,
          authors: 'Vários Autores',
        });

      suggestionId = response.body.id;
    });

    it('should delete a book suggestion', () => {
      return request(app.getHttpServer())
        .delete(`/book-suggestions/${suggestionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should return 404 when suggestion not found', () => {
      return request(app.getHttpServer())
        .delete('/book-suggestions/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/book-suggestions/${suggestionId}`)
        .expect(401);
    });
  });
});
