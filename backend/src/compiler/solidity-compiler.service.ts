import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import * as solc from 'solc';
import { createHash } from 'crypto';

export interface CompilerSettings {
  version: string;
  evmVersion: string;
  optimizer: boolean;
  runs: number;
}

export interface CompilationInput {
  sourceCode: string;
  contractName: string;
  settings: CompilerSettings;
}

export interface CompilationOutput {
  abi: any[];
  bytecode: string;
  metadata: any;
  gasEstimates?: any;
  sourceHash: string;
  compiledAt: Date;
}

export interface CompilerError {
  severity: 'error' | 'warning' | 'info';
  message: string;
  sourceLocation?: {
    file: string;
    start: number;
    end: number;
  };
  type: string;
}

@Injectable()
export class SolidityCompilerService {
  private readonly logger = new Logger(SolidityCompilerService.name);
  
  constructor(private configService: ConfigService) {}

  /**
   * Compile Solidity contract with specified settings
   */
  async compileContract(input: CompilationInput): Promise<CompilationOutput> {
    const startTime = Date.now();
    
    try {
      const { sourceCode, contractName, settings } = input;
      
      // Generate source hash for caching
      const sourceHash = this.generateSourceHash(sourceCode, settings);
      
      // Prepare compilation input
      const compilationInput = this.prepareCompilationInput(sourceCode, contractName, settings);
      
      if (this.configService.app.testEnv) {
        this.logger.debug(`Compiling contract ${contractName} with ${settings.version}`);
      }

      // Compile the contract
      const compilationResult = JSON.parse(solc.compile(JSON.stringify(compilationInput)));
      
      // Check for errors
      if (compilationResult.errors) {
        this.handleCompilationErrors(compilationResult.errors, contractName);
      }

      // Extract compiled contract
      const contractPath = `${contractName}.sol`;
      const compiledContract = compilationResult.contracts?.[contractPath]?.[contractName];
      
      if (!compiledContract) {
        throw new BadRequestException(`Contract ${contractName} not found in compilation output`);
      }

      const compileTime = Date.now() - startTime;
      
      if (this.configService.app.testEnv) {
        this.logger.debug(`Compilation completed in ${compileTime}ms`);
      }

      return {
        abi: compiledContract.abi || [],
        bytecode: compiledContract.evm?.bytecode?.object || '',
        metadata: compiledContract.metadata ? JSON.parse(compiledContract.metadata) : {},
        gasEstimates: compiledContract.evm?.gasEstimates,
        sourceHash,
        compiledAt: new Date(),
      };

    } catch (error) {
      const compileTime = Date.now() - startTime;
      
      this.logger.error('Compilation failed:', {
        contract: input.contractName,
        settings: input.settings,
        compileTime,
        error: error.message,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`Compilation failed: ${error.message}`);
    }
  }

  /**
   * Prepare Solidity compilation input
   */
  private prepareCompilationInput(sourceCode: string, contractName: string, settings: CompilerSettings) {
    return {
      language: 'Solidity',
      sources: {
        [`${contractName}.sol`]: {
          content: sourceCode,
        },
      },
      settings: {
        evmVersion: settings.evmVersion,
        optimizer: {
          enabled: settings.optimizer,
          runs: settings.runs,
        },
        outputSelection: {
          '*': {
            '*': [
              'abi',
              'evm.bytecode',
              'evm.deployedBytecode',
              'evm.gasEstimates',
              'metadata',
            ],
          },
        },
        metadata: {
          useLiteralContent: true,
        },
      },
    };
  }

  /**
   * Handle compilation errors and warnings
   */
  private handleCompilationErrors(errors: any[], contractName: string): void {
    const criticalErrors = errors.filter(error => error.severity === 'error');
    const warnings = errors.filter(error => error.severity === 'warning');

    if (warnings.length > 0 && this.configService.app.testEnv) {
      this.logger.warn(`Compilation warnings for ${contractName}:`, warnings);
    }

    if (criticalErrors.length > 0) {
      const errorMessages = criticalErrors.map(error => error.formattedMessage || error.message);
      throw new BadRequestException(`Compilation errors: ${errorMessages.join('; ')}`);
    }
  }

  /**
   * Generate hash for source code and settings (for caching)
   */
  generateSourceHash(sourceCode: string, settings: CompilerSettings): string {
    const hashInput = JSON.stringify({
      source: sourceCode,
      settings: {
        version: settings.version,
        evmVersion: settings.evmVersion,
        optimizer: settings.optimizer,
        runs: settings.runs,
      },
    });

    return createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Get default compiler settings
   */
  getDefaultSettings(): CompilerSettings {
    return {
      version: '0.8.30',
      evmVersion: 'cancun', // 0G Chain supports Cancun
      optimizer: true,
      runs: 200,
    };
  }

  /**
   * Validate compiler settings
   */
  validateSettings(settings: CompilerSettings): void {
    const supportedVersions = ['0.8.20', '0.8.30'];
    const supportedEvmVersions = ['cancun', 'paris', 'shanghai'];

    if (!supportedVersions.includes(settings.version)) {
      throw new BadRequestException(`Unsupported compiler version: ${settings.version}`);
    }

    if (!supportedEvmVersions.includes(settings.evmVersion)) {
      throw new BadRequestException(`Unsupported EVM version: ${settings.evmVersion}`);
    }

    if (settings.runs < 1 || settings.runs > 10000) {
      throw new BadRequestException('Optimizer runs must be between 1 and 10000');
    }
  }

  /**
   * Get compiler information
   */
  getCompilerInfo() {
    return {
      solc_version: solc.version(),
      supported_versions: ['0.8.20', '0.8.30'],
      supported_evm_versions: ['cancun', 'paris', 'shanghai'],
      default_settings: this.getDefaultSettings(),
    };
  }

  /**
   * Estimate compilation complexity
   */
  estimateComplexity(sourceCode: string): {
    lines: number;
    complexity: 'low' | 'medium' | 'high';
    estimated_time_ms: number;
  } {
    const lines = sourceCode.split('\n').length;
    let complexity: 'low' | 'medium' | 'high';
    let estimated_time_ms: number;

    if (lines < 100) {
      complexity = 'low';
      estimated_time_ms = 1000;
    } else if (lines < 500) {
      complexity = 'medium';
      estimated_time_ms = 3000;
    } else {
      complexity = 'high';
      estimated_time_ms = 10000;
    }

    return { lines, complexity, estimated_time_ms };
  }
}