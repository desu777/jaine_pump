import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DatabaseHealthService } from './database-health.service';
import { ConfigModule } from '../config/config.module';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService, DatabaseHealthService],
  exports: [PrismaService, DatabaseHealthService],
})
export class DatabaseModule {}