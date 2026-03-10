import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { InMemoryUserRepository } from '../../repositories/in-memory';
import { USER_REPOSITORY } from '../../repositories/tokens';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        {
          provide: USER_REPOSITORY,
          useClass: InMemoryUserRepository,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      const registerDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.username).toBe(registerDto.username);
      expect(result.user.email).toBe(registerDto.email);
      expect(result.accessToken).toBe('mocked-jwt-token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should register a user with profile image', async () => {
      const registerDto = {
        username: 'userWithImage',
        email: 'user@example.com',
        password: 'password123',
        profileImage: 'image.jpg',
      };

      const result = await service.register(registerDto);

      expect(result.user.profileImage).toBe(registerDto.profileImage);
    });

    it('should generate JWT token on registration', async () => {
      const registerDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      await service.register(registerDto);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: expect.any(Number),
          username: registerDto.username,
          role: expect.any(String),
        }),
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await usersService.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should login with email and return tokens', async () => {
      const loginDto = {
        login: 'test@example.com',
        password: 'password123',
      };

      const result = await service.login(loginDto);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(loginDto.login);
      expect(result.accessToken).toBe('mocked-jwt-token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should login with username and return tokens', async () => {
      const loginDto = {
        login: 'testuser',
        password: 'password123',
      };

      const result = await service.login(loginDto);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.username).toBe(loginDto.login);
      expect(result.accessToken).toBe('mocked-jwt-token');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const loginDto = {
        login: 'nonexistent@example.com',
        password: 'password123',
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const loginDto = {
        login: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should generate JWT token on login', async () => {
      const loginDto = {
        login: 'test@example.com',
        password: 'password123',
      };

      await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: expect.any(Number),
          username: 'testuser',
          role: expect.any(String),
        }),
      );
    });

    it('should not expose password hash in response', async () => {
      const loginDto = {
        login: 'test@example.com',
        password: 'password123',
      };

      const result = await service.login(loginDto);

      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });
});
