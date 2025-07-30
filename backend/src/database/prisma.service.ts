import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';
import { ConfigService } from '../config/config.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private database: Database.Database;

  constructor(private configService: ConfigService) {
    const dbUrl = configService.database.url;
    const dbPath = dbUrl.replace('file:', '');
    
    // Initialize better-sqlite3 database
    const database = new Database(dbPath, {
      verbose: configService.app.testEnv ? console.log : undefined,
    });
    
    // Enable WAL mode for better concurrent access
    database.pragma('journal_mode = WAL');
    database.pragma('synchronous = NORMAL');
    database.pragma('cache_size = 1000000');
    database.pragma('foreign_keys = true');
    database.pragma('temp_store = memory');
    
    // Initialize Prisma with better-sqlite3 adapter
    const adapter = new PrismaBetterSQLite3(database);
    
    super({
      adapter,
      log: configService.app.isDevelopment 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error'],
      errorFormat: 'pretty',
    });

    this.database = database;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
      
      if (this.configService.app.testEnv) {
        await this.runDiagnostics();
      }
    } catch (error) {
      this.logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.database?.close();
      this.logger.log('🔌 Database disconnected');
    } catch (error) {
      this.logger.error('Error during database disconnect:', error);
    }
  }

  /**
   * Generate simp_nick from wallet address
   */
  generateSimpNick(walletAddress: string): string {
    const lastFour = walletAddress.slice(-4).toLowerCase();
    return `simp_${lastFour}`;
  }

  /**
   * Clean database for testing environments
   */
  async cleanDatabase(): Promise<void> {
    if (this.configService.app.isProduction) {
      throw new Error('Clean database not allowed in production');
    }
    
    await this.$transaction([
      this.deployment.deleteMany(),
      this.session.deleteMany(),
      this.compilationCache.deleteMany(),
      this.contractTemplate.deleteMany(),
      this.simp.deleteMany(),
    ]);

    this.logger.log('🧹 Database cleaned for testing');
  }

  /**
   * Run database diagnostics
   */
  private async runDiagnostics(): Promise<void> {
    try {
      const simpsCount = await this.simp.count();
      const templatesCount = await this.contractTemplate.count();
      const deploymentsCount = await this.deployment.count();
      
      this.logger.log(`📊 Database diagnostics:
        - Simps: ${simpsCount}
        - Templates: ${templatesCount}
        - Deployments: ${deploymentsCount}`);
    } catch (error) {
      this.logger.warn('Failed to run diagnostics:', error);
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    const [simpsCount, templatesCount, deploymentsCount, sessionsCount] = await Promise.all([
      this.simp.count(),
      this.contractTemplate.count(),
      this.deployment.count(),
      this.session.count(),
    ]);

    return {
      simps: simpsCount,
      templates: templatesCount,
      deployments: deploymentsCount,
      sessions: sessionsCount,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health check for database
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Execute raw query with logging
   */
  async executeRaw(query: string, params: any[] = []): Promise<any> {
    if (this.configService.app.testEnv) {
      this.logger.debug(`Executing raw query: ${query}`, params);
    }
    
    return this.$queryRawUnsafe(query, ...params);
  }

  /**
   * Get connection info
   */
  getConnectionInfo() {
    return {
      adapter: 'better-sqlite3',
      database_url: this.configService.database.url,
      wal_enabled: true,
      foreign_keys: true,
    };
  }
}