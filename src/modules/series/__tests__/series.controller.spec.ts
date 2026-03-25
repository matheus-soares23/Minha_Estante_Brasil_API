import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { SeriesModule } from '../series.module';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import {
  SERIES_REPOSITORY,
  USER_REPOSITORY,
} from '../../../repositories/tokens';
import {
  InMemorySeriesRepository,
  InMemoryUserRepository,
} from '../../../repositories/in-memory';

describe('SeriesController (integration)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SeriesModule, AuthModule, UsersModule],
    })
      .overrideProvider(SERIES_REPOSITORY)
      .useClass(InMemorySeriesRepository)
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

  describe('/series (POST)', () => {
    it('should create a new series', () => {
      return request(app.getHttpServer())
        .post('/series')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Harry Potter',
          description: 'Série de livros de fantasia',
          slug: 'harry-potter',
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.name).toBe('Harry Potter');
          expect(response.body.slug).toBe('harry-potter');
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/series')
        .send({
          name: 'Harry Potter',
        })
        .expect(401);
    });

    it('should return 400 with invalid data', () => {
      return request(app.getHttpServer())
        .post('/series')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'Missing name',
        })
        .expect(400);
    });
  });

  describe('/series (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/series')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'O Senhor dos Anéis',
        });

      await request(app.getHttpServer())
        .post('/series')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'As Crônicas de Nárnia',
        });
    });

    it('should return all series', () => {
      return request(app.getHttpServer())
        .get('/series')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThanOrEqual(2);
        });
    });
  });

  describe('/series/:id (GET)', () => {
    let seriesId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/series')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Percy Jackson',
          description: 'Aventuras de semideuses',
        });

      seriesId = response.body.id;
    });

    it('should return a series by id', () => {
      return request(app.getHttpServer())
        .get(`/series/${seriesId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(seriesId);
          expect(response.body.name).toBe('Percy Jackson');
        });
    });

    it('should return 404 when series not found', () => {
      return request(app.getHttpServer()).get('/series/999').expect(404);
    });
  });

  describe('/series/:id (PATCH)', () => {
    let seriesId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/series')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Divergente',
        });

      seriesId = response.body.id;
    });

    it('should update a series', () => {
      return request(app.getHttpServer())
        .patch(`/series/${seriesId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Divergente - Série',
          description: 'Trilogia distópica',
        })
        .expect(200)
        .then((response) => {
          expect(response.body.name).toBe('Divergente - Série');
          expect(response.body.description).toBe('Trilogia distópica');
        });
    });

    it('should return 404 when series not found', () => {
      return request(app.getHttpServer())
        .patch('/series/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated',
        })
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/series/${seriesId}`)
        .send({
          name: 'Updated',
        })
        .expect(401);
    });
  });

  describe('/series/:id (DELETE)', () => {
    let seriesId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/series')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Série para Deletar',
        });

      seriesId = response.body.id;
    });

    it('should delete a series', () => {
      return request(app.getHttpServer())
        .delete(`/series/${seriesId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should return 404 when series not found', () => {
      return request(app.getHttpServer())
        .delete('/series/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/series/${seriesId}`)
        .expect(401);
    });
  });
});
