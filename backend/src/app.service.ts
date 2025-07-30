import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from './config/config.service';
import { DatabaseHealthService } from './database/database-health.service';
import { PrismaService } from './database/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly startTime = new Date();

  constructor(
    private configService: ConfigService,
    private databaseHealth: DatabaseHealthService,
    private prisma: PrismaService,
  ) {}

  /**
   * Get basic API information
   */
  getApiInfo() {
    const appConfig = this.configService.app;
    
    return {
      name: 'PumpJaine Backend API',
      version: '1.0.0',
      description: '💔 The Ultimate Simp Contract Deployer - Blockchain-based heartbreak simulator',
      timestamp: new Date().toISOString(),
      environment: appConfig.env,
      uptime_seconds: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
      documentation: appConfig.isDevelopment ? '/docs' : null,
    };
  }

  /**
   * Get detailed service status
   */
  async getDetailedStatus() {
    const appConfig = this.configService.app;
    const networkConfig = this.configService.network;

    try {
      // Check service health
      const [dbHealth, statistics] = await Promise.all([
        this.databaseHealth.getHealthStatus(),
        this.getStatistics(),
      ]);

      const overallStatus = dbHealth.status === 'healthy' ? 'healthy' : 'degraded';

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: appConfig.env,
        services: {
          database: dbHealth.status === 'healthy' ? 'operational' : 'degraded',
          authentication: 'operational', // SIWE is stateless
          compiler: 'operational',       // Solc is embedded
          templates: 'operational',      // File-based templates
        },
        network: {
          name: '0G-Galileo-Testnet',
          chain_id: networkConfig.chainId,
          rpc: networkConfig.rpc,
          explorer: networkConfig.explorer,
        },
        database: {
          response_time_ms: dbHealth.responseTime,
          connection: dbHealth.connection.adapter,
        },
        statistics,
        uptime: {
          seconds: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
          started_at: this.startTime.toISOString(),
        },
      };

    } catch (error) {
      this.logger.error('Failed to get detailed status:', error);
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: appConfig.env,
        error: 'Failed to retrieve service status',
        services: {
          database: 'unknown',
          authentication: 'unknown',
          compiler: 'unknown',  
          templates: 'unknown',
        },
      };
    }
  }

  /**
   * Get version and build information
   */
  getVersionInfo() {
    return {
      version: '1.0.0',
      build_date: this.startTime.toISOString(),
      commit_hash: process.env.GIT_COMMIT || 'unknown',
      node_version: process.version,
      dependencies: {
        nestjs: '10.4.3',
        prisma: '6.11.1',
        solc: '0.8.30',
        siwe: '2.3.2',
        'better-sqlite3': '11.5.0',
      },
      features: {
        siwe_auth: true,
        solidity_compiler: true,
        contract_templates: true,
        deployment_tracking: true,
        rarity_system: true,
        leaderboard: true,
      },
    };
  }

  /**
   * Get platform statistics
   */
  private async getStatistics() {
    try {
      const [userCount, deploymentCount, templateCount] = await Promise.all([
        this.prisma.simp.count(),
        this.prisma.deployment.count(),
        this.prisma.contractTemplate.count(),
      ]);

      return {
        total_users: userCount,
        total_deployments: deploymentCount,
        total_templates: templateCount,
      };

    } catch (error) {
      this.logger.warn('Failed to get statistics:', error);
      
      return {
        total_users: 0,
        total_deployments: 0,
        total_templates: 0,
      };
    }
  }
}