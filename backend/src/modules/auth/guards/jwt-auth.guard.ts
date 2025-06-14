import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug('Route is public, skipping authentication');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    this.logger.debug(`Authorization header: ${authHeader}`);
    
    if (!authHeader) {
      this.logger.error('No authorization header found');
      throw new UnauthorizedException('No authorization header found');
    }

    if (!authHeader.startsWith('Bearer ')) {
      this.logger.error('Invalid authorization header format');
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const token = authHeader.split(' ')[1];
    this.logger.debug(`Token: ${token}`);

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err) {
      this.logger.error(`Authentication error: ${err.message}`);
      throw new UnauthorizedException(err.message);
    }
    if (!user) {
      this.logger.error('User not found in token');
      throw new UnauthorizedException('Invalid token or token expired');
    }
    this.logger.debug(`User authenticated successfully: ${user.email}`);
    return user;
  }
} 