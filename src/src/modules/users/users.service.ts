import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    await this.checkUniqueConstraints(
      createUserDto.username,
      createUserDto.email,
    );

    const passwordHash = await bcrypt.hash(
      createUserDto.password,
      this.SALT_ROUNDS,
    );

    const user = await this.prisma.user.create({
      data: {
        username: createUserDto.username,
        email: createUserDto.email,
        passwordHash,
        profileImage: createUserDto.profileImage,
        role: createUserDto.role,
      },
    });

    return this.excludePassword(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { username: 'asc' },
    });

    return users.map((user) => this.excludePassword(user));
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.excludePassword(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    if (updateUserDto.username || updateUserDto.email) {
      await this.checkUniqueConstraints(
        updateUserDto.username,
        updateUserDto.email,
        id,
      );
    }

    const data: any = {
      username: updateUserDto.username,
      email: updateUserDto.email,
      profileImage: updateUserDto.profileImage,
      role: updateUserDto.role,
    };

    if (updateUserDto.password) {
      data.passwordHash = await bcrypt.hash(
        updateUserDto.password,
        this.SALT_ROUNDS,
      );
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    return this.excludePassword(user);
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.user.delete({
      where: { id },
    });
  }

  private async checkUniqueConstraints(
    username?: string,
    email?: string,
    excludeId?: number,
  ) {
    if (username) {
      const existingUsername = await this.prisma.user.findFirst({
        where: {
          username,
          id: excludeId ? { not: excludeId } : undefined,
        },
      });

      if (existingUsername) {
        throw new ConflictException('Username already exists');
      }
    }

    if (email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email,
          id: excludeId ? { not: excludeId } : undefined,
        },
      });

      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }
  }

  private excludePassword(user: any) {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
