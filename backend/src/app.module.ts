import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Core modules
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ContractTemplateModule } from './contract-template/contract-template.module';
import { CompilerModule } from './compiler/compiler.module';
import { DeployModule } from './deploy/deploy.module';

// Main app components
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Config service for dynamic configuration
import { ConfigService } from './config/config.service';

@Module({
  imports: [
    // Global configuration
    ConfigModule,

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const throttleConfig = configService.throttle;
        return [
          {
            name: 'default',
            ttl: throttleConfig.ttl,
            limit: throttleConfig.limit,
          },
          {
            name: 'auth',
            ttl: 60000, // 1 minute
            limit: 10,  // 10 attempts per minute for auth
          },
          {
            name: 'compiler',
            ttl: 300000, // 5 minutes  
            limit: 20,   // 20 compilations per 5 minutes
          },
        ];
      },
    }),

    // Core infrastructure
    DatabaseModule,

    // Feature modules
    AuthModule,
    UserModule,
    ContractTemplateModule,
    CompilerModule,
    DeployModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global throttling guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}