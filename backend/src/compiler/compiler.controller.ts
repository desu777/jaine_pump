import { Controller, Post, Body, Get, UseGuards, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CompilerService } from './compiler.service';
import { 
  CompileContractDto, 
  CompilationResultDto, 
  CompilerStatusDto 
} from './dto/compiler.dto';

@ApiTags('compiler')
@ApiExtraModels(CompileContractDto, CompilationResultDto, CompilerStatusDto)
@Controller('compiler')
@UseGuards(SessionAuthGuard)
export class CompilerController {
  constructor(private readonly compilerService: CompilerService) {}

  @Post('compile')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Compile Solidity contract from template',
    description: 'Compiles a contract template to ABI and bytecode with caching support'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Contract compiled successfully', 
    type: CompilationResultDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid compilation parameters' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 404, description: 'Contract template not found' })
  async compileContract(
    @Body() compileDto: CompileContractDto,
    @CurrentUser('wallet_address') walletAddress: string,
  ): Promise<CompilationResultDto> {
    return this.compilerService.compileContract(compileDto);
  }

  @Public()
  @Get('status')
  @ApiOperation({ 
    summary: 'Get compiler service status',
    description: 'Returns comprehensive status information about the compiler service'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Compiler status information', 
    type: CompilerStatusDto 
  })
  async getCompilerStatus(): Promise<CompilerStatusDto> {
    return this.compilerService.getCompilerStatus();
  }

  @Public()
  @Get('info')
  @ApiOperation({ 
    summary: 'Get compiler information',
    description: 'Returns available compiler versions and supported features'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Compiler information',
    schema: {
      type: 'object',
      properties: {
        solc_version: { type: 'string', example: '0.8.30+commit.abcdef12' },
        supported_versions: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['0.8.20', '0.8.30']
        },
        supported_evm_versions: {
          type: 'array',
          items: { type: 'string' },
          example: ['cancun', 'paris', 'shanghai']
        },
        default_settings: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            evmVersion: { type: 'string' },
            optimizer: { type: 'boolean' },
            runs: { type: 'number' }
          }
        }
      }
    }
  })
  getCompilerInfo() {
    return this.compilerService['solidityCompiler'].getCompilerInfo();
  }

  @Get('performance')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get compiler performance metrics',
    description: 'Returns detailed performance statistics for the compiler service'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Performance metrics',
    schema: {
      type: 'object',
      properties: {
        total_compilations: { type: 'number' },
        successful_compilations: { type: 'number' },
        failed_compilations: { type: 'number' },
        success_rate_percent: { type: 'number' },
        average_compile_time_ms: { type: 'number' },
        total_compile_time_ms: { type: 'number' },
        cache_hit_rate_percent: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  getPerformanceMetrics(@CurrentUser('wallet_address') walletAddress: string) {
    return this.compilerService.getPerformanceMetrics();
  }

  @Delete('cache')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Clear compilation cache',
    description: 'Removes all cached compilation results to force fresh compilations'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cache cleared successfully',
    schema: {
      type: 'object',
      properties: {
        cleared: { type: 'number', description: 'Number of cache entries cleared' },
        message: { type: 'string', description: 'Success message' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 400, description: 'Failed to clear cache' })
  async clearCache(@CurrentUser('wallet_address') walletAddress: string) {
    return this.compilerService.clearCache();
  }

  @Public()
  @Get('health')
  @ApiOperation({ 
    summary: 'Compiler service health check',
    description: 'Quick health check for the compiler service'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'degraded', 'unavailable'] },
        timestamp: { type: 'string', format: 'date-time' },
        version: { type: 'string' },
        uptime_ms: { type: 'number' }
      }
    }
  })
  async healthCheck() {
    const startTime = process.uptime() * 1000;
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime_ms: Math.round(startTime),
      services: {
        solidity_compiler: 'operational',
        compilation_cache: 'operational',
        file_system: 'operational',
      },
    };
  }
}