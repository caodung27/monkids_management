import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { UsersService } from 'src/modules/users/services/users.service';
import { RegisterDto } from '../dto/register.dto';
import { ContextIdFactory } from '@nestjs/core';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    this.logger.debug(`Attempting to register user: ${registerDto.email}`);

    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      this.logger.error(`User with email ${registerDto.email} already exists`);
      throw new ConflictException('Email already exists');
    }

    // Hash password before creating user
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);
    this.logger.debug(
      `Password hashed successfully for user: ${registerDto.email}`,
    );

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    this.logger.debug(`User registered successfully: ${user.email}`);
    return user;
  }

  async validateUser(email: string, inputPassword: string): Promise<User> {
    this.logger.debug(`Validating user: ${email}`);

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.error(`User not found: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      this.logger.error(`User has no password set: ${email}`);
      throw new UnauthorizedException('Please set your password');
    }

    try {
      const isPasswordValid = await bcrypt.compare(
        inputPassword,
        user.password,
      );
      this.logger.debug(`Password validation result: ${isPasswordValid}`);

      if (!isPasswordValid) {
        this.logger.error(`Invalid password for user: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.debug(`User validated successfully: ${email}`);
      const result = Object.fromEntries(
        Object.entries(user).filter(([key]) => key !== 'password'),
      ) as User;
      return result;
    } catch {
      throw new UnauthorizedException();
    }
  }

  login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async introspectToken(user: User) {
    try {
      const currentUser = await this.usersService.findOne(user.id);
      if (!currentUser || !currentUser.is_active) {
        return { active: false, reason: 'User not found or inactive' };
      }

      // Get the token from the request
      const token = this.jwtService.decode(
        this.getTokenFromRequest()
      ) as { exp: number };

      if (!token) {
        return { active: false, reason: 'Invalid token format' };
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (token.exp && token.exp < now) {
        return { active: false, reason: 'Token expired' };
      }

      return {
        active: true,
        user: {
          id: currentUser.id,
          email: currentUser.email,
          role: currentUser.role,
        },
      };
    } catch (error) {
      this.logger.error(`Token introspection failed: ${error.message}`);
      return { active: false, reason: error.message };
    }
  }

  private getTokenFromRequest(): string {
    const req = this.getCurrentRequest();
    if (!req || !req.headers.authorization) {
      throw new Error('No authorization header found');
    }
    return req.headers.authorization.replace('Bearer ', '');
  }

  private getCurrentRequest() {
    const contextId = ContextIdFactory.getByRequest(this.request);
    if (!contextId) {
      throw new Error('No request context found');
    }
    return this.request;
  }

  async verifyToken(user: User) {
    try {
      const currentUser = await this.usersService.findOne(user.id);
      if (!currentUser || !currentUser.is_active) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return {
        valid: true,
        user: {
          id: currentUser.id,
          email: currentUser.email,
          role: currentUser.role,
        },
      };
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.is_active) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const newAccessToken = this.jwtService.sign(
        { email: user.email, sub: user.id, role: user.role },
        { expiresIn: '1h' }
      );

      return {
        access_token: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    try {
      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        message: 'Logout successful',
        user: {
          id: user.id,
          email: user.email,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error during logout: ${errorMessage}`);
      throw error;
    }
  }

  async updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<User> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.password) {
      throw new UnauthorizedException('No password set for this user');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new UnauthorizedException('Mật khẩu mới không được trùng với mật khẩu hiện tại');
    }

    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    return this.usersService.update(userId, {
      password: hashedPassword,
    });
  }
}
