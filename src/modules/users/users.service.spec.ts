import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { InMemoryUserRepository } from '../../repositories/in-memory';
import { USER_REPOSITORY } from '../../repositories/tokens';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let repository: InMemoryUserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USER_REPOSITORY,
          useClass: InMemoryUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<InMemoryUserRepository>(USER_REPOSITORY);
  });

  afterEach(() => {
    repository['users'] = [];
    repository['currentId'] = 1;
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        profileImage: 'profile.jpg',
        role: UserRole.user,
      };

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.username).toBe(createUserDto.username);
      expect(result.email).toBe(createUserDto.email);
      expect(result.profileImage).toBe(createUserDto.profileImage);
      expect(result.role).toBe(createUserDto.role);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should hash the password', async () => {
      const createUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      await service.create(createUserDto);

      const userInRepo = repository['users'][0];
      expect(userInRepo.passwordHash).toBeDefined();
      expect(userInRepo.passwordHash).not.toBe(createUserDto.password);
      const isMatch = await bcrypt.compare(
        createUserDto.password,
        userInRepo.passwordHash,
      );
      expect(isMatch).toBe(true);
    });

    it('should throw ConflictException when username already exists', async () => {
      await service.create({
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password123',
      });

      await expect(
        service.create({
          username: 'testuser',
          email: 'test2@example.com',
          password: 'password456',
        }),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.create({
          username: 'testuser',
          email: 'test2@example.com',
          password: 'password456',
        }),
      ).rejects.toThrow('Username already exists');
    });

    it('should throw ConflictException when email already exists', async () => {
      await service.create({
        username: 'testuser1',
        email: 'test@example.com',
        password: 'password123',
      });

      await expect(
        service.create({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'password456',
        }),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.create({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'password456',
        }),
      ).rejects.toThrow('Email already exists');
    });

    it('should create a user without optional fields', async () => {
      const createUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await service.create(createUserDto);

      expect(result.profileImage).toBeNull();
      expect(result.role).toBe(UserRole.user);
    });
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      await service.create({
        username: 'user1',
        email: 'user1@example.com',
        password: 'password1',
      });
      await service.create({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password2',
      });

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      result.forEach((user) => {
        expect(user).not.toHaveProperty('passwordHash');
      });
    });

    it('should return empty array when no users exist', async () => {
      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id without password', async () => {
      const user = await service.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await service.findOne(user.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'User with ID 999 not found',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email with password', async () => {
      await service.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await service.findByEmail('test@example.com');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(result?.passwordHash).toBeDefined();
    });

    it('should return null when email does not exist', async () => {
      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should return a user by username with password', async () => {
      await service.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await service.findByUsername('testuser');

      expect(result).toBeDefined();
      expect(result?.username).toBe('testuser');
      expect(result?.passwordHash).toBeDefined();
    });

    it('should return null when username does not exist', async () => {
      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const user = await service.create({
        username: 'original',
        email: 'original@example.com',
        password: 'password123',
      });

      const updateDto = {
        username: 'updated',
        email: 'updated@example.com',
        profileImage: 'new-image.jpg',
      };

      const result = await service.update(user.id, updateDto);

      expect(result.username).toBe(updateDto.username);
      expect(result.email).toBe(updateDto.email);
      expect(result.profileImage).toBe(updateDto.profileImage);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should update password and hash it', async () => {
      const user = await service.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'oldpassword',
      });

      const newPassword = 'newpassword123';
      await service.update(user.id, { password: newPassword });

      const userInRepo = repository['users'][0];
      const isMatch = await bcrypt.compare(newPassword, userInRepo.passwordHash);
      expect(isMatch).toBe(true);
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      await expect(
        service.update(999, { username: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updating to existing username', async () => {
      await service.create({
        username: 'user1',
        email: 'user1@example.com',
        password: 'password1',
      });
      const user2 = await service.create({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password2',
      });

      await expect(
        service.update(user2.id, { username: 'user1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when updating to existing email', async () => {
      await service.create({
        username: 'user1',
        email: 'user1@example.com',
        password: 'password1',
      });
      const user2 = await service.create({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password2',
      });

      await expect(
        service.update(user2.id, { email: 'user1@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating username to same value', async () => {
      const user = await service.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await service.update(user.id, {
        username: 'testuser',
      });

      expect(result.username).toBe('testuser');
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      const user = await service.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      await service.remove(user.id);

      await expect(service.findOne(user.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when removing non-existent user', async () => {
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
