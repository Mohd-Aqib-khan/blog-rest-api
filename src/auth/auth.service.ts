import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import bcrypt from 'bcrypt';
import { GoogleAuthService } from './google-auth/google-auth.service';
import { AuthToken } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private googleAuthService: GoogleAuthService,
  ) {}

  async validateOAuthLogin(profile: {
    providerId: string;
    email: string;
    name: string;
    provider: string;
  }): Promise<User> {
    return await this.usersService.findOrCreate(profile);
  }

  async validateNormalLogin(email: string, password: string): Promise<User> {
    const user: User | null = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isMatch: boolean = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new BadRequestException('Password does not match');
    }
    return user;
  }

  login(user: { id: number; email: string }): AuthToken {
    const payload = { id: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(user: {
    email: string;
    password: string;
    name: string;
  }): Promise<AuthToken> {
    const existingUser = await this.usersService.findOneByEmail(user.email);
    if (existingUser) {
      throw new BadRequestException('email already exists');
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser: User = {
      ...user,
      password: hashedPassword,
    } as User;
    const insertedUser: User = await this.usersService.create(newUser);
    return this.login(insertedUser);
  }
}
