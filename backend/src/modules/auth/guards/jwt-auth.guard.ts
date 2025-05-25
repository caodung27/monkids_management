import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
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

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.error(`Authentication failed: ${err?.message || 'User not found'}`);
      throw new UnauthorizedException('Invalid token or token expired');
    }
    return user;
  }
} 