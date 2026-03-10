import { InMemoryUserRepository } from './in-memory-user.repository';
import { UserRole } from '@prisma/client';

describe('InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
  });

  describe('findByUsernameExcludingId', () => {
    it('should return null when username not found', async () => {
      const result = await repository.findByUsernameExcludingId('test', 1);

      expect(result).toBeNull();
    });

    it('should exclude user with given id', async () => {
      const user1 = await repository.create({
        username: 'testuser',
        email: 'test1@example.com',
        passwordHash: 'hash1',
      });

      await repository.create({
        username: 'testuser2',
        email: 'test2@example.com',
        passwordHash: 'hash2',
      });

      const result = await repository.findByUsernameExcludingId(
        'testuser',
        user1.id,
      );

      expect(result).toBeNull();
    });

    it('should return user with username when id is different', async () => {
      await repository.create({
        username: 'testuser',
        email: 'test1@example.com',
        passwordHash: 'hash1',
      });

      const result = await repository.findByUsernameExcludingId('testuser', 999);

      expect(result).toBeDefined();
      expect(result?.username).toBe('testuser');
    });
  });

  describe('findByEmailExcludingId', () => {
    it('should return null when email not found', async () => {
      const result = await repository.findByEmailExcludingId(
        'test@example.com',
        1,
      );

      expect(result).toBeNull();
    });

    it('should exclude user with given id', async () => {
      const user1 = await repository.create({
        username: 'user1',
        email: 'test@example.com',
        passwordHash: 'hash1',
      });

      const result = await repository.findByEmailExcludingId(
        'test@example.com',
        user1.id,
      );

      expect(result).toBeNull();
    });

    it('should return user with email when id is different', async () => {
      await repository.create({
        username: 'user1',
        email: 'test@example.com',
        passwordHash: 'hash1',
      });

      const result = await repository.findByEmailExcludingId(
        'test@example.com',
        999,
      );

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
    });
  });

  describe('update', () => {
    it('should throw error when updating non-existent user', async () => {
      await expect(
        repository.update(999, { username: 'test' }),
      ).rejects.toThrow('User not found');
    });
  });

  describe('delete', () => {
    it('should throw error when deleting non-existent user', async () => {
      await expect(repository.delete(999)).rejects.toThrow('User not found');
    });
  });

  describe('create', () => {
    it('should create user with default role', async () => {
      const user = await repository.create({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hash',
      });

      expect(user.role).toBe(UserRole.user);
    });
  });
});
