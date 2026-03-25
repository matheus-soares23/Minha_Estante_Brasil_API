import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { GenresModule } from '../genres.module';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import {
  GENRE_REPOSITORY,
  USER_REPOSITORY,
} from '../../../repositories/tokens';
import {
  InMemoryGenreRepository,
  InMemoryUserRepository,
} from '../../../repositories/in-memory';

describe('GenresController (integration)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GenresModule, AuthModule, UsersModule],
    })
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
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/genres (POST)', () => {
    it('should create a new genre', () => {
      return request(app.getHttpServer())
        .post('/genres')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Romance',
          description: 'Gênero literário focado em narrativas',
          slug: 'romance',
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.name).toBe('Romance');
          expect(response.body.slug).toBe('romance');
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/genres')
        .send({
          name: 'Romance',
        })
        .expect(401);
    });

    it('should return 400 with invalid data', () => {
      return request(app.getHttpServer())
        .post('/genres')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'Missing name',
        })
        .expect(400);
    });
  });

  describe('/genres (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/genres')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Ficção Científica',
        });

      await request(app.getHttpServer())
        .post('/genres')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Fantasia',
        });
    });

    it('should return all genres', () => {
      return request(app.getHttpServer())
        .get('/genres')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThanOrEqual(2);
        });
    });
  });

  describe('/genres/:id (GET)', () => {
    let genreId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/genres')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Terror',
          description: 'Histórias de suspense e medo',
        });

      genreId = response.body.id;
    });

    it('should return a genre by id', () => {
      return request(app.getHttpServer())
        .get(`/genres/${genreId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(genreId);
          expect(response.body.name).toBe('Terror');
        });
    });

    it('should return 404 when genre not found', () => {
      return request(app.getHttpServer()).get('/genres/999').expect(404);
    });
  });

  describe('/genres/:id (PATCH)', () => {
    let genreId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/genres')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Suspense',
        });

      genreId = response.body.id;
    });

    it('should update a genre', () => {
      return request(app.getHttpServer())
        .patch(`/genres/${genreId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Suspense Psicológico',
          description: 'Suspense focado na psique',
        })
        .expect(200)
        .then((response) => {
          expect(response.body.name).toBe('Suspense Psicológico');
          expect(response.body.description).toBe('Suspense focado na psique');
        });
    });

    it('should return 404 when genre not found', () => {
      return request(app.getHttpServer())
        .patch('/genres/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated',
        })
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/genres/${genreId}`)
        .send({
          name: 'Updated',
        })
        .expect(401);
    });
  });

  describe('/genres/:id (DELETE)', () => {
    let genreId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/genres')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Gênero para Deletar',
        });

      genreId = response.body.id;
    });

    it('should delete a genre', () => {
      return request(app.getHttpServer())
        .delete(`/genres/${genreId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should return 404 when genre not found', () => {
      return request(app.getHttpServer())
        .delete('/genres/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/genres/${genreId}`)
        .expect(401);
    });
  });
});
