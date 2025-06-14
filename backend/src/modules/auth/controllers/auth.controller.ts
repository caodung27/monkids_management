import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Logger,
  UnauthorizedException,
  Patch,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { User } from '../../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const user: User = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    return this.authService.login(user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Return user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Req() req: RequestWithUser) {
    return req.user;
  }

  @Patch('update-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid password format' })
  async updatePassword(
    @Req() req: RequestWithUser,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    const updatedUser = await this.authService.updatePassword(
      req.user.id,
      updatePasswordDto.oldPassword,
      updatePasswordDto.newPassword,
    );
    return { message: 'Password updated successfully', user: updatedUser };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() req: RequestWithUser) {
    return this.authService.logout(req.user.id);
  }

  @Post('token/introspect')
  @UseGuards(JwtAuthGuard)
  async introspectToken(@Req() req: RequestWithUser) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    return this.authService.introspectToken(req.user);
  }

  @Post('token/verify')
  @UseGuards(JwtAuthGuard)
  async verifyToken(@Req() req: RequestWithUser) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    return this.authService.verifyToken(req.user);
  }

  @Post('token/refresh')
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    return this.authService.refreshToken(refreshToken);
  }
}
