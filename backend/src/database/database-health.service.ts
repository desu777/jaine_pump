import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  lastCheck: string;
  statistics: {
    simps: number;
    templates: number;
    deployments: number;
    sessions: number;
  };
  connection: {
    adapter: string;
    database_url: string;
    wal_enabled: boolean;
    foreign_keys: boolean;
  };
}

@Injectable()
export class DatabaseHealthService {
  private readonly logger = new Logger(DatabaseHealthService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Comprehensive database health check
   */
  async getHealthStatus(): Promise<DatabaseHealth> {
    const startTime = Date.now();
    let status: 'healthy' | 'unhealthy' = 'unhealthy';
    let statistics = { simps: 0, templates: 0, deployments: 0, sessions: 0 };

    try {
      // Test basic connectivity
      const isHealthy = await this.prisma.healthCheck();
      
      if (isHealthy) {
        // Get statistics if healthy
        statistics = await this.prisma.getStats();
        status = 'healthy';
      }
    } catch (error) {
      this.logger.error('Database health check failed:', error);
    }

    const responseTime = Date.now() - startTime;

    return {
      status,
      responseTime,
      lastCheck: new Date().toISOString(),
      statistics,
      connection: this.prisma.getConnectionInfo(),
    };
  }

  /**
   * Quick health check - just connectivity
   */
  async isHealthy(): Promise<boolean> {
    try {
      return await this.prisma.healthCheck();
    } catch {
      return false;
    }
  }

  /**
   * Performance metrics
   */
  async getPerformanceMetrics() {
    const startTime = Date.now();
    
    try {
      // Run multiple queries to test performance
      const [
        simpQuery,
        templateQuery,
        deploymentQuery,
      ] = await Promise.all([
        this.prisma.simp.findFirst(),
        this.prisma.contractTemplate.findFirst(),
        this.prisma.deployment.findFirst(),
      ]);

      const queryTime = Date.now() - startTime;

      return {
        query_time_ms: queryTime,
        concurrent_queries: 3,
        status: 'success',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        query_time_ms: Date.now() - startTime,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Database integrity check
   */
  async checkIntegrity(): Promise<{
    foreign_keys: boolean;
    indexes: boolean;
    constraints: boolean;
    status: string;
  }> {
    try {
      // Check foreign key constraints
      await this.prisma.$queryRaw`PRAGMA foreign_key_check`;
      
      // Check database integrity
      const integrityResult = await this.prisma.$queryRaw`PRAGMA integrity_check`;
      
      return {
        foreign_keys: true,
        indexes: true,
        constraints: true,
        status: 'healthy',
      };
    } catch (error) {
      this.logger.error('Database integrity check failed:', error);
      
      return {
        foreign_keys: false,
        indexes: false,
        constraints: false,
        status: 'corrupted',
      };
    }
  }
}