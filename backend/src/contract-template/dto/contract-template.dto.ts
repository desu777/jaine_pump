import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';

export enum RarityType {
  COMMON = 'COMMON',
  COPE_HARDER = 'COPE_HARDER',
  MAXIMUM_COPE = 'MAXIMUM_COPE',
  ULTIMATE_REJECTION = 'ULTIMATE_REJECTION',
  ASCENDED_SIMP = 'ASCENDED_SIMP',
  LEGENDARY_ULTRA = 'LEGENDARY_ULTRA',
}

export class GetRandomTemplateDto {
  @ApiProperty({
    description: 'Specific rarity to select from',
    enum: RarityType,
    required: false
  })
  @IsOptional()
  @IsEnum(RarityType)
  rarity?: RarityType;

  @ApiProperty({
    description: 'User wallet address for personalized selection',
    required: false
  })
  @IsOptional()
  @IsString()
  user_address?: string;
}

export class ContractTemplateDto {
  @ApiResponseProperty({
    description: 'Template unique identifier'
  })
  id: number;

  @ApiResponseProperty({
    description: 'Contract template name'
  })
  name: string;

  @ApiResponseProperty({
    description: 'Template rarity level',
    enum: RarityType
  })
  rarity: RarityType;

  @ApiResponseProperty({
    description: 'Path to contract source file'
  })
  file_path: string;

  @ApiResponseProperty({
    description: 'Template description'
  })
  description: string;

  @ApiResponseProperty({
    description: 'Total number of deployments'
  })
  total_deployments: number;

  @ApiResponseProperty({
    description: 'Creation timestamp'
  })
  created_at: string;

  @ApiResponseProperty({
    description: 'Last update timestamp'
  })
  updated_at: string;
}

export class RarityConfigDto {
  @ApiResponseProperty({
    description: 'Rarity name'
  })
  name: string;

  @ApiResponseProperty({
    description: 'Selection weight (percentage)'
  })
  weight: number;

  @ApiResponseProperty({
    description: 'Display color (hex)'
  })
  color: string;

  @ApiResponseProperty({
    description: 'Rarity description'
  })
  description: string;

  @ApiResponseProperty({
    description: 'Number of available templates'
  })
  template_count: number;

  @ApiResponseProperty({
    description: 'Total deployments for this rarity'
  })
  total_deployments: number;
}

export class TemplateStatsDto {
  @ApiResponseProperty({
    description: 'Total number of templates'
  })
  total_templates: number;

  @ApiResponseProperty({
    description: 'Templates by rarity',
    type: 'object'
  })
  by_rarity: Record<string, number>;

  @ApiResponseProperty({
    description: 'Total deployments across all templates'
  })
  total_deployments: number;

  @ApiResponseProperty({
    description: 'Most popular template'
  })
  most_popular: {
    name: string;
    rarity: string;
    deployments: number;
  };

  @ApiResponseProperty({
    description: 'Least deployed template'
  })
  least_deployed: {
    name: string;
    rarity: string;
    deployments: number;
  };
}