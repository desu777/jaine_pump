import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;
      
      if (!authHeader) {
        throw new UnauthorizedException('No authorization token provided');
      }
      
      if (!authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Invalid authorization format. Use Bearer token');
      }
      
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      
      throw err || new UnauthorizedException('Authentication failed');
    }
    
    return user;
  }
}