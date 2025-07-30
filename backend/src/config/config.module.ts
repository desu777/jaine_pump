import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { configValidationSchema } from './config.validation';
import { envLoader } from './env-loader';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
      load: [
        () => {
          // Validate required environment variables on startup
          envLoader.validateRequiredVars();
          return envLoader.getAllVars();
        }
      ],
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}