import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SiweService } from './siwe.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.jwt.secret,
        signOptions: { 
          expiresIn: configService.jwt.expiresIn,
          issuer: configService.security.domain,
          audience: configService.security.domain,
        },
      }),
      inject: [ConfigService],
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, SiweService, JwtStrategy],
  exports: [AuthService, SiweService, JwtStrategy, PassportModule],
})
export class AuthModule {}