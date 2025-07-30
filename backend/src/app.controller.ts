import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ 
    summary: 'API root endpoint',
    description: 'Returns basic API information and health status'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'API information',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'PumpJaine Backend API' },
        version: { type: 'string', example: '1.0.0' },
        description: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        environment: { type: 'string', example: 'production' },
        uptime_seconds: { type: 'number' }
      }
    }
  })
  getRoot() {
    return this.appService.getApiInfo();
  }

  @Public()
  @Get('status')
  @ApiOperation({ 
    summary: 'Detailed service status',
    description: 'Returns comprehensive status information for all services'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Detailed service status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
        timestamp: { type: 'string', format: 'date-time' },
        version: { type: 'string' },
        environment: { type: 'string' },
        services: {
          type: 'object',
          properties: {
            database: { type: 'string', enum: ['operational', 'degraded', 'down'] },
            authentication: { type: 'string', enum: ['operational', 'degraded', 'down'] },
            compiler: { type: 'string', enum: ['operational', 'degraded', 'down'] },
            templates: { type: 'string', enum: ['operational', 'degraded', 'down'] }
          }
        },
        network: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            chain_id: { type: 'string' },
            rpc: { type: 'string' },
            explorer: { type: 'string' }
          }
        },
        statistics: {
          type: 'object',
          properties: {
            total_users: { type: 'number' },
            total_deployments: { type: 'number' },
            total_templates: { type: 'number' }
          }
        }
      }
    }
  })
  async getStatus() {
    return this.appService.getDetailedStatus();
  }

  @Public()
  @Get('version')
  @ApiOperation({ 
    summary: 'API version information',
    description: 'Returns version and build information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Version information',
    schema: {
      type: 'object',
      properties: {
        version: { type: 'string' },
        build_date: { type: 'string', format: 'date-time' },
        commit_hash: { type: 'string' },
        node_version: { type: 'string' },
        dependencies: {
          type: 'object',
          properties: {
            nestjs: { type: 'string' },
            prisma: { type: 'string' },
            solc: { type: 'string' },
            siwe: { type: 'string' }
          }
        }
      }
    }
  })
  getVersion() {
    return this.appService.getVersionInfo();
  }
}