import { UserRole } from '@prisma/client';

export interface CreateUserData {
  username: string;
  email: string;
  passwordHash: string;
  profileImage?: string;
  role?: UserRole;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  passwordHash?: string;
  profileImage?: string;
  role?: UserRole;
}

export interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  profileImage: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findAll(): Promise<User[]>;
  findOne(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByUsernameExcludingId(
    username: string,
    excludeId: number,
  ): Promise<User | null>;
  findByEmailExcludingId(
    email: string,
    excludeId: number,
  ): Promise<User | null>;
  update(id: number, data: UpdateUserData): Promise<User>;
  delete(id: number): Promise<void>;
}
