import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthorsModule } from '../authors.module';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import {
  AUTHOR_REPOSITORY,
  USER_REPOSITORY,
} from '../../../repositories/tokens';
import {
  InMemoryAuthorRepository,
  InMemoryUserRepository,
} from '../../../repositories/in-memory';

describe('AuthorsController (integration)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthorsModule, AuthModule, UsersModule],
    })
      .overrideProvider(AUTHOR_REPOSITORY)
      .useClass(InMemoryAuthorRepository)
      .overrideProvider(USER_REPOSITORY)
      .useClass(InMemoryUserRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Criar usuário e fazer login para obter token
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

  describe('/authors (POST)', () => {
    it('should create a new author', () => {
      return request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Machado de Assis',
          biography: 'Grande escritor brasileiro',
          birthDate: '1839-06-21',
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.name).toBe('Machado de Assis');
          expect(response.body.biography).toBe('Grande escritor brasileiro');
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/authors')
        .send({
          name: 'Machado de Assis',
        })
        .expect(401);
    });

    it('should return 400 with invalid data', () => {
      return request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          birthDate: 'invalid-date',
        })
        .expect(400);
    });
  });

  describe('/authors (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Clarice Lispector',
        });

      await request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Jorge Amado',
        });
    });

    it('should return all authors', () => {
      return request(app.getHttpServer())
        .get('/authors')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThanOrEqual(2);
        });
    });
  });

  describe('/authors/:id (GET)', () => {
    let authorId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Carlos Drummond de Andrade',
          biography: 'Poeta brasileiro',
        });

      authorId = response.body.id;
    });

    it('should return an author by id', () => {
      return request(app.getHttpServer())
        .get(`/authors/${authorId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(authorId);
          expect(response.body.name).toBe('Carlos Drummond de Andrade');
        });
    });

    it('should return 404 when author not found', () => {
      return request(app.getHttpServer()).get('/authors/999').expect(404);
    });
  });

  describe('/authors/:id (PUT)', () => {
    let authorId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Cecília Meireles',
        });

      authorId = response.body.id;
    });

    it('should update an author', () => {
      return request(app.getHttpServer())
        .put(`/authors/${authorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Cecília Meireles (Atualizado)',
          biography: 'Poetisa brasileira',
        })
        .expect(200)
        .then((response) => {
          expect(response.body.name).toBe('Cecília Meireles (Atualizado)');
          expect(response.body.biography).toBe('Poetisa brasileira');
        });
    });

    it('should return 404 when author not found', () => {
      return request(app.getHttpServer())
        .put('/authors/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated',
        })
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .put(`/authors/${authorId}`)
        .send({
          name: 'Updated',
        })
        .expect(401);
    });
  });

  describe('/authors/:id (DELETE)', () => {
    let authorId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Monteiro Lobato',
        });

      authorId = response.body.id;
    });

    it('should delete an author', () => {
      return request(app.getHttpServer())
        .delete(`/authors/${authorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should return 404 when author not found', () => {
      return request(app.getHttpServer())
        .delete('/authors/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/authors/${authorId}`)
        .expect(401);
    });
  });
});
