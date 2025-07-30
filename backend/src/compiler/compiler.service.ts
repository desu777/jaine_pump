import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { SolidityCompilerService, CompilerSettings, CompilationInput } from './solidity-compiler.service';
import { CompilationCacheService } from './compilation-cache.service';
import { ConfigService } from '../config/config.service';
import { ContractTemplateService } from '../contract-template/contract-template.service';
import { CompileContractDto, CompilationResultDto, CompilerStatusDto } from './dto/compiler.dto';
import { readFileSync } from 'fs';

@Injectable()
export class CompilerService {
  private readonly logger = new Logger(CompilerService.name);
  private compilationCount = 0;
  private failedCompilations = 0;
  private totalCompileTime = 0;

  constructor(
    private solidityCompiler: SolidityCompilerService,
    private cacheService: CompilationCacheService,
    private configService: ConfigService,
    private contractTemplateService: ContractTemplateService,
  ) {}

  /**
   * Compile contract by template name
   */
  async compileContract(compileDto: CompileContractDto): Promise<CompilationResultDto> {
    const startTime = Date.now();
    this.compilationCount++;

    try {
      // Get contract template
      const template = await this.contractTemplateService.getTemplateByName(compileDto.template_name);
      
      if (!template) {
        throw new NotFoundException(`Contract template ${compileDto.template_name} not found`);
      }

      // Read source code
      const sourceCode = this.readContractSource(template.file_path);
      
      // Prepare compiler settings
      const settings: CompilerSettings = {
        version: compileDto.compiler_version || '0.8.30',
        evmVersion: compileDto.evm_version || 'cancun',
        optimizer: compileDto.optimize !== false,
        runs: 200,
      };

      // Validate settings
      this.solidityCompiler.validateSettings(settings);

      // Generate source hash
      const sourceHash = this.solidityCompiler.generateSourceHash(sourceCode, settings);

      // Check cache unless force recompile
      let compilationResult;
      let fromCache = false;

      if (!compileDto.force_recompile) {
        compilationResult = await this.cacheService.getCached(sourceHash, template.id);
        if (compilationResult) {
          fromCache = true;
        }
      }

      // Compile if not cached
      if (!compilationResult) {
        const compilationInput: CompilationInput = {
          sourceCode,
          contractName: template.name,
          settings,
        };

        compilationResult = await this.solidityCompiler.compileContract(compilationInput);
        
        // Cache the result
        await this.cacheService.setCached(sourceHash, template.id, compilationResult);
      }

      const compileTime = Date.now() - startTime;
      this.totalCompileTime += compileTime;

      if (this.configService.app.testEnv) {
        this.logger.debug(`Compiled ${template.name} in ${compileTime}ms (cached: ${fromCache})`);
      }

      return {
        success: true,
        abi: compilationResult.abi,
        bytecode: compilationResult.bytecode,
        template: {
          name: template.name,
          rarity: template.rarity,
          description: template.description || '',
        },
        compilation_settings: {
          compiler_version: settings.version,
          evm_version: settings.evmVersion,
          optimizer: settings.optimizer,
          runs: settings.runs,
        },
        metadata: {
          source_hash: compilationResult.sourceHash,
          compiled_at: compilationResult.compiledAt.toISOString(),
          cached: fromCache,
          gas_estimates: compilationResult.gasEstimates,
        },
      };

    } catch (error) {
      this.failedCompilations++;
      const compileTime = Date.now() - startTime;
      
      this.logger.error('Compilation failed:', {
        template: compileDto.template_name,
        error: error.message,
        compileTime,
      });

      return {
        success: false,
        abi: [],
        bytecode: '',
        template: {
          name: compileDto.template_name,
          rarity: 'UNKNOWN',
          description: 'Compilation failed',
        },
        compilation_settings: {
          compiler_version: compileDto.compiler_version || '0.8.30',
          evm_version: compileDto.evm_version || 'cancun',
          optimizer: compileDto.optimize !== false,
          runs: 200,
        },
        metadata: {
          source_hash: '',
          compiled_at: new Date().toISOString(),
          cached: false,
        },
        error: {
          type: error.constructor.name,
          message: error.message,
          details: error.stack?.split('\n').slice(0, 5),
        },
      };
    }
  }

  /**
   * Get compiler service status
   */
  async getCompilerStatus(): Promise<CompilerStatusDto> {
    try {
      const cacheStats = await this.cacheService.getCacheStats();
      const compilerInfo = this.solidityCompiler.getCompilerInfo();

      const averageCompileTime = this.compilationCount > 0 
        ? Math.round(this.totalCompileTime / this.compilationCount)
        : 0;

      return {
        status: 'healthy',
        available_versions: compilerInfo.supported_versions,
        supported_evm_versions: compilerInfo.supported_evm_versions,
        cache_stats: {
          total_cached: cacheStats.total_cached,
          cache_hit_rate: cacheStats.cache_hit_rate,
          last_cleanup: cacheStats.last_cleanup,
        },
        performance: {
          average_compile_time_ms: averageCompileTime,
          total_compilations: this.compilationCount,
          failed_compilations: this.failedCompilations,
        },
      };

    } catch (error) {
      this.logger.error('Failed to get compiler status:', error);
      
      return {
        status: 'degraded',
        available_versions: ['0.8.30'],
        supported_evm_versions: ['cancun'],
        cache_stats: {
          total_cached: 0,
          cache_hit_rate: 0,
          last_cleanup: new Date().toISOString(),
        },
        performance: {
          average_compile_time_ms: 0,
          total_compilations: this.compilationCount,
          failed_compilations: this.failedCompilations,
        },
      };
    }
  }

  /**
   * Clear compilation cache
   */
  async clearCache(): Promise<{ cleared: number; message: string }> {
    try {
      const cleared = await this.cacheService.clearCache();
      
      return {
        cleared,
        message: `Successfully cleared ${cleared} cache entries`,
      };

    } catch (error) {
      this.logger.error('Failed to clear cache:', error);
      throw new BadRequestException('Failed to clear compilation cache');
    }
  }

  /**
   * Read contract source code from file
   */
  private readContractSource(filePath: string): string {
    try {
      return readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new NotFoundException(`Contract source file not found: ${filePath}`);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const averageCompileTime = this.compilationCount > 0 
      ? Math.round(this.totalCompileTime / this.compilationCount)
      : 0;

    const successRate = this.compilationCount > 0
      ? ((this.compilationCount - this.failedCompilations) / this.compilationCount) * 100
      : 0;

    return {
      total_compilations: this.compilationCount,
      successful_compilations: this.compilationCount - this.failedCompilations,
      failed_compilations: this.failedCompilations,
      success_rate_percent: Math.round(successRate * 100) / 100,
      average_compile_time_ms: averageCompileTime,
      total_compile_time_ms: this.totalCompileTime,
      cache_hit_rate_percent: this.cacheService.getCacheHitRate(),
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.compilationCount = 0;
    this.failedCompilations = 0;
    this.totalCompileTime = 0;
    this.cacheService.resetStats();
  }
}