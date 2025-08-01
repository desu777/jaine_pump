import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';

export enum CompilerVersion {
  SOLC_0_8_20 = '0.8.20',
  SOLC_0_8_30 = '0.8.30',
}

export enum EvmVersion {
  CANCUN = 'cancun',
  PARIS = 'paris',
  SHANGHAI = 'shanghai',
}

export class CompileContractDto {
  @ApiProperty({
    description: 'Contract template name to compile',
    example: 'JAINE_LEFT_ME_ON_READ'
  })
  @IsString()
  @IsNotEmpty()
  template_name: string;

  @ApiProperty({
    description: 'Solidity compiler version',
    enum: CompilerVersion,
    default: CompilerVersion.SOLC_0_8_30,
    required: false
  })
  @IsOptional()
  @IsEnum(CompilerVersion)
  compiler_version?: CompilerVersion;

  @ApiProperty({
    description: 'EVM version target',
    enum: EvmVersion,
    default: EvmVersion.CANCUN,
    required: false
  })
  @IsOptional()
  @IsEnum(EvmVersion)
  evm_version?: EvmVersion;

  @ApiProperty({
    description: 'Enable optimizer',
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  optimize?: boolean;

  @ApiProperty({
    description: 'Force recompilation (skip cache)',
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  force_recompile?: boolean;
}

export class CompilationResultDto {
  @ApiResponseProperty({
    description: 'Compilation success status'
  })
  success: boolean;

  @ApiResponseProperty({
    description: 'Contract ABI',
    type: 'array'
  })
  abi: any[];

  @ApiResponseProperty({
    description: 'Contract bytecode'
  })
  bytecode: string;

  @ApiResponseProperty({
    description: 'Contract template information'
  })
  template: {
    name: string;
    rarity: string;
    description: string;
  };

  @ApiResponseProperty({
    description: 'Compilation settings used'
  })
  compilation_settings: {
    compiler_version: string;
    evm_version: string;
    optimizer: boolean;
    runs: number;
  };

  @ApiResponseProperty({
    description: 'Compilation metadata'
  })
  metadata: {
    source_hash: string;
    compiled_at: string;
    cached: boolean;
    gas_estimates?: any;
  };

  @ApiResponseProperty({
    description: 'Error information if compilation failed',
    required: false
  })
  error?: {
    type: string;
    message: string;
    details?: any;
  };
}

export class CompilerStatusDto {
  @ApiResponseProperty({
    description: 'Compiler service status'
  })
  status: 'healthy' | 'degraded' | 'unavailable';

  @ApiResponseProperty({
    description: 'Available compiler versions'
  })
  available_versions: string[];

  @ApiResponseProperty({
    description: 'Supported EVM versions'
  })
  supported_evm_versions: string[];

  @ApiResponseProperty({
    description: 'Cache statistics'
  })
  cache_stats: {
    total_cached: number;
    cache_hit_rate: number;
    last_cleanup: string;
  };

  @ApiResponseProperty({
    description: 'Performance metrics'
  })
  performance: {
    average_compile_time_ms: number;
    total_compilations: number;
    failed_compilations: number;
  };
}