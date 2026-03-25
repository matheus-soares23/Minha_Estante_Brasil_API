import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from '../auth.module';
import { UsersModule } from '../../users/users.module';
import { USER_REPOSITORY } from '../../../repositories/tokens';
import { InMemoryUserRepository } from '../../../repositories/in-memory';

describe('AuthController (integration)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, UsersModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(InMemoryUserRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('accessToken');
          expect(response.body).toHaveProperty('user');
          expect(response.body.user.username).toBe('testuser');
          expect(response.body.user.email).toBe('test@example.com');
          expect(response.body.user).not.toHaveProperty('passwordHash');
        });
    });

    it('should return 400 when username is too short', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'ab',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 400 when email is invalid', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 400 when password is too short', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '12345',
        })
        .expect(400);
    });

    it('should return 409 when username already exists', async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password123',
      });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test2@example.com',
          password: 'password123',
        })
        .expect(409);
    });

    it('should return 409 when email already exists', async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        username: 'testuser1',
        email: 'test@example.com',
        password: 'password123',
      });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        username: 'logintest',
        email: 'login@example.com',
        password: 'password123',
      });
    });

    it('should login with username', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          login: 'logintest',
          password: 'password123',
        })
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('accessToken');
          expect(response.body).toHaveProperty('user');
          expect(response.body.user.username).toBe('logintest');
        });
    });

    it('should login with email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          login: 'login@example.com',
          password: 'password123',
        })
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('accessToken');
          expect(response.body.user.email).toBe('login@example.com');
        });
    });

    it('should return 401 when credentials are invalid', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          login: 'logintest',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 401 when user does not exist', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          login: 'nonexistent',
          password: 'password123',
        })
        .expect(401);
    });

    it('should return 400 when password is too short', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          login: 'logintest',
          password: '12345',
        })
        .expect(400);
    });
  });
});
