import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: number;
  username: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create({
      username: registerDto.username,
      email: registerDto.email,
      password: registerDto.password,
      profileImage: registerDto.profileImage,
    });

    const tokens = this.generateTokens({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return { user, ...tokens };
  }

  async login(loginDto: LoginDto) {
    const user =
      (await this.usersService.findByEmail(loginDto.login)) ||
      (await this.usersService.findByUsername(loginDto.login));

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash, ...userWithoutPassword } = user;

    const tokens = this.generateTokens({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return { user: userWithoutPassword, ...tokens };
  }

  private generateTokens(payload: JwtPayload) {
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
