import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto';
import { IUserRepository } from '../../repositories/interfaces';
import { USER_REPOSITORY } from '../../repositories/tokens';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async create(createUserDto: CreateUserDto) {
    await this.checkUniqueConstraints(
      createUserDto.username,
      createUserDto.email,
    );

    const passwordHash = await bcrypt.hash(
      createUserDto.password,
      this.SALT_ROUNDS,
    );

    const user = await this.userRepository.create({
      username: createUserDto.username,
      email: createUserDto.email,
      passwordHash,
      profileImage: createUserDto.profileImage,
      role: createUserDto.role,
    });

    return this.excludePassword(user);
  }

  async findAll() {
    const users = await this.userRepository.findAll();
    return users.map((user) => this.excludePassword(user));
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.excludePassword(user);
  }

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async findByUsername(username: string) {
    return this.userRepository.findByUsername(username);
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

    const data: {
      username?: string;
      email?: string;
      passwordHash?: string;
      profileImage?: string;
      role?: any;
    } = {
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

    const user = await this.userRepository.update(id, data);

    return this.excludePassword(user);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.userRepository.delete(id);
  }

  private async checkUniqueConstraints(
    username?: string,
    email?: string,
    excludeId?: number,
  ) {
    if (username) {
      const existingUsername = excludeId
        ? await this.userRepository.findByUsernameExcludingId(
            username,
            excludeId,
          )
        : await this.userRepository.findByUsername(username);

      if (existingUsername) {
        throw new ConflictException('Username already exists');
      }
    }

    if (email) {
      const existingEmail = excludeId
        ? await this.userRepository.findByEmailExcludingId(email, excludeId)
        : await this.userRepository.findByEmail(email);

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
