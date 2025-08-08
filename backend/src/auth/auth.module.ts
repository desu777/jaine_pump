import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SiweService } from './siwe.service';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { UserModule } from '../user/user.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    ConfigModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, SiweService, SessionAuthGuard],
  exports: [AuthService, SiweService, SessionAuthGuard],
})
export class AuthModule {}