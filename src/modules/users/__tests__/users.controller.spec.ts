import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UsersModule } from '../users.module';
import { AuthModule } from '../../auth/auth.module';
import { USER_REPOSITORY } from '../../../repositories/tokens';
import { InMemoryUserRepository } from '../../../repositories/in-memory';

describe('UsersController (integration)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UsersModule, AuthModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(InMemoryUserRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Criar usuário e fazer login para obter token
    await request(app.getHttpServer()).post('/auth/register').send({
      username: 'adminuser',
      email: 'admin@example.com',
      password: 'password123',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login: 'adminuser',
        password: 'password123',
      });

    accessToken = loginResponse.body.accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.username).toBe('newuser');
          expect(response.body.email).toBe('newuser@example.com');
          expect(response.body).not.toHaveProperty('passwordHash');
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should return 400 with invalid data', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'ab',
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);
    });

    it('should return 409 when username already exists', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'duplicateuser',
          email: 'user1@example.com',
          password: 'password123',
        });

      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'duplicateuser',
          email: 'user2@example.com',
          password: 'password123',
        })
        .expect(409);
    });
  });

  describe('/users (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'user1',
          email: 'user1@example.com',
          password: 'password123',
        });

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'user2',
          email: 'user2@example.com',
          password: 'password123',
        });
    });

    it('should return all users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThanOrEqual(3);
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });
  });

  describe('/users/:id (GET)', () => {
    let userId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'getuser',
          email: 'getuser@example.com',
          password: 'password123',
        });

      userId = response.body.id;
    });

    it('should return a user by id', () => {
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(userId);
          expect(response.body.username).toBe('getuser');
          expect(response.body).not.toHaveProperty('passwordHash');
        });
    });

    it('should return 404 when user not found', () => {
      return request(app.getHttpServer())
        .get('/users/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get(`/users/${userId}`).expect(401);
    });
  });

  describe('/users/:id (PUT)', () => {
    let userId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'updateuser',
          email: 'updateuser@example.com',
          password: 'password123',
        });

      userId = response.body.id;
    });

    it('should update a user', () => {
      return request(app.getHttpServer())
        .put(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'updateduser',
          email: 'updated@example.com',
        })
        .expect(200)
        .then((response) => {
          expect(response.body.username).toBe('updateduser');
          expect(response.body.email).toBe('updated@example.com');
        });
    });

    it('should return 404 when user not found', () => {
      return request(app.getHttpServer())
        .put('/users/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'updateduser',
        })
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send({
          username: 'updateduser',
        })
        .expect(401);
    });
  });

  describe('/users/:id (DELETE)', () => {
    let userId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'deleteuser',
          email: 'deleteuser@example.com',
          password: 'password123',
        });

      userId = response.body.id;
    });

    it('should delete a user', () => {
      return request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should return 404 when user not found', () => {
      return request(app.getHttpServer())
        .delete('/users/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .expect(401);
    });
  });
});
