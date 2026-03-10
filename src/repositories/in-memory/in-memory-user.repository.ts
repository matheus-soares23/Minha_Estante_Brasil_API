import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
  User,
} from '../interfaces';

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [];
  private currentId = 1;

  async create(data: CreateUserData): Promise<User> {
    const user: User = {
      id: this.currentId++,
      username: data.username,
      email: data.email,
      passwordHash: data.passwordHash,
      profileImage: data.profileImage || null,
      role: data.role || UserRole.user,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.push(user);
    return user;
  }

  async findAll(): Promise<User[]> {
    return [...this.users].sort((a, b) => a.username.localeCompare(b.username));
  }

  async findOne(id: number): Promise<User | null> {
    return this.users.find((u) => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find((u) => u.username === username) || null;
  }

  async findByUsernameExcludingId(
    username: string,
    excludeId: number,
  ): Promise<User | null> {
    return (
      this.users.find((u) => u.username === username && u.id !== excludeId) ||
      null
    );
  }

  async findByEmailExcludingId(
    email: string,
    excludeId: number,
  ): Promise<User | null> {
    return (
      this.users.find((u) => u.email === email && u.id !== excludeId) || null
    );
  }

  async update(id: number, data: UpdateUserData): Promise<User> {
    const index = this.users.findIndex((u) => u.id === id);

    if (index === -1) {
      throw new Error('User not found');
    }

    this.users[index] = {
      ...this.users[index],
      username: data.username ?? this.users[index].username,
      email: data.email ?? this.users[index].email,
      passwordHash: data.passwordHash ?? this.users[index].passwordHash,
      profileImage: data.profileImage ?? this.users[index].profileImage,
      role: data.role ?? this.users[index].role,
      updatedAt: new Date(),
    };

    return this.users[index];
  }

  async delete(id: number): Promise<void> {
    const index = this.users.findIndex((u) => u.id === id);

    if (index === -1) {
      throw new Error('User not found');
    }

    this.users.splice(index, 1);
  }
}
