import { Controller, Post, Body, Get, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DeployService } from './deploy.service';
import { RecordDeploymentDto, DeploymentResponseDto, DeploymentStatsDto } from './dto/deploy.dto';

@ApiTags('deployments')
@Controller('deployments')
@UseGuards(SessionAuthGuard)
export class DeployController {
  constructor(private readonly deployService: DeployService) {}

  @Post('record')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Record contract deployment',
    description: 'Records a successful contract deployment and updates user statistics'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Deployment recorded successfully', 
    type: DeploymentResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid deployment data or duplicate transaction' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async recordDeployment(
    @Body() recordDto: RecordDeploymentDto,
    @CurrentUser('wallet_address') walletAddress: string,
  ): Promise<DeploymentResponseDto> {
    return this.deployService.recordDeployment(walletAddress, recordDto);
  }

  @Public()
  @Get('stats')
  @ApiOperation({ 
    summary: 'Get deployment statistics',
    description: 'Returns comprehensive deployment statistics across the platform'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Deployment statistics', 
    type: DeploymentStatsDto 
  })
  async getDeploymentStats(): Promise<DeploymentStatsDto> {
    return this.deployService.getDeploymentStats();
  }

  @Get('my-deployments')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get current user deployments',
    description: 'Returns deployment history for the authenticated user'
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of deployments to return' })
  @ApiResponse({ 
    status: 200, 
    description: 'User deployments',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          contract_address: { type: 'string' },
          tx_hash: { type: 'string' },
          block_number: { type: 'number' },
          gas_used: { type: 'string' },
          template: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              rarity: { type: 'string' },
              description: { type: 'string' }
            }
          },
          created_at: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async getMyDeployments(
    @CurrentUser('wallet_address') walletAddress: string,
    @Query('limit') limit?: string,
  ) {
    const deploymentLimit = limit ? parseInt(limit, 10) : 50;
    return this.deployService.getUserDeployments(walletAddress, deploymentLimit);
  }

  @Public()
  @Get('tx/:txHash')
  @ApiOperation({ 
    summary: 'Get deployment by transaction hash',
    description: 'Returns deployment details for a specific transaction'
  })
  @ApiParam({ name: 'txHash', description: 'Transaction hash' })
  @ApiResponse({ 
    status: 200, 
    description: 'Deployment details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        contract_address: { type: 'string' },
        tx_hash: { type: 'string' },
        block_number: { type: 'number' },
        gas_used: { type: 'string' },
        template: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            rarity: { type: 'string' },
            description: { type: 'string' }
          }
        },
        simp: {
          type: 'object',
          properties: {
            simp_nick: { type: 'string' },
            total_deploys: { type: 'number' }
          }
        },
        created_at: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Deployment not found' })
  async getDeploymentByTxHash(@Param('txHash') txHash: string) {
    return this.deployService.getDeploymentByTxHash(txHash);
  }

  @Public()
  @Get('contract/:address')
  @ApiOperation({ 
    summary: 'Get deployment by contract address',
    description: 'Returns deployment details for a specific contract address'
  })
  @ApiParam({ name: 'address', description: 'Contract address' })
  @ApiResponse({ 
    status: 200, 
    description: 'Deployment details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        contract_address: { type: 'string' },
        tx_hash: { type: 'string' },
        block_number: { type: 'number' },
        gas_used: { type: 'string' },
        template: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            rarity: { type: 'string' },
            description: { type: 'string' }
          }
        },
        simp: {
          type: 'object',
          properties: {
            simp_nick: { type: 'string' },
            total_deploys: { type: 'number' }
          }
        },
        created_at: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Deployment not found' })
  async getDeploymentByContractAddress(@Param('address') address: string) {
    return this.deployService.getDeploymentByContractAddress(address);
  }

  @Public()
  @Get('template/:templateName')
  @ApiOperation({ 
    summary: 'Get deployments by template name',
    description: 'Returns all deployments for a specific contract template'
  })
  @ApiParam({ name: 'templateName', description: 'Contract template name' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of deployments to return' })
  @ApiResponse({ 
    status: 200, 
    description: 'Template deployments',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          contract_address: { type: 'string' },
          tx_hash: { type: 'string' },
          block_number: { type: 'number' },
          gas_used: { type: 'string' },
          simp: {
            type: 'object',
            properties: {
              simp_nick: { type: 'string' },
              total_deploys: { type: 'number' }
            }
          },
          created_at: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getDeploymentsByTemplate(
    @Param('templateName') templateName: string,
    @Query('limit') limit?: string,
  ) {
    const deploymentLimit = limit ? parseInt(limit, 10) : 100;
    return this.deployService.getDeploymentsByTemplate(templateName, deploymentLimit);
  }
}