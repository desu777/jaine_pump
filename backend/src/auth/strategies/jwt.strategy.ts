import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, JwtPayload } from '../auth.service';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwt.secret,
      issuer: configService.security.domain,
      audience: configService.security.domain,
    });
  }

  async validate(payload: JwtPayload) {
    try {
      // Validate payload structure
      if (!payload.wallet_address || !payload.simp_nick) {
        throw new UnauthorizedException('Invalid token payload structure');
      }

      // Validate user exists and is active
      const user = await this.authService.validateJwtPayload(payload);
      
      if (this.configService.app.testEnv) {
        this.logger.debug(`JWT validation successful for ${payload.simp_nick}`);
      }

      return user;
      
    } catch (error) {
      this.logger.error('JWT strategy validation failed:', {
        error: error.message,
        wallet: payload?.wallet_address,
      });
      
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}