import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
  User,
} from '../interfaces';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
        profileImage: data.profileImage,
        role: data.role,
      },
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: { username: 'asc' },
    });
  }

  async findOne(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findByUsernameExcludingId(
    username: string,
    excludeId: number,
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        username,
        id: { not: excludeId },
      },
    });
  }

  async findByEmailExcludingId(
    email: string,
    excludeId: number,
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
        id: { not: excludeId },
      },
    });
  }

  async update(id: number, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
        profileImage: data.profileImage,
        role: data.role,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
