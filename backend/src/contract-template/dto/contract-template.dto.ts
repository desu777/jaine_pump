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
  @ApiProperty({
    description: 'Template unique identifier'
  })
  id: number;

  @ApiProperty({
    description: 'Contract template name'
  })
  name: string;

  @ApiProperty({
    description: 'Template rarity level',
    enum: RarityType
  })
  rarity: RarityType;

  @ApiProperty({
    description: 'Path to contract source file'
  })
  file_path: string;

  @ApiProperty({
    description: 'Template description'
  })
  description: string;

  @ApiProperty({
    description: 'Total number of deployments'
  })
  total_deployments: number;

  @ApiProperty({
    description: 'Creation timestamp'
  })
  created_at: string;

  @ApiProperty({
    description: 'Last update timestamp'
  })
  updated_at: string;
}

export class RarityConfigDto {
  @ApiProperty({
    description: 'Rarity name'
  })
  name: string;

  @ApiProperty({
    description: 'Selection weight (percentage)'
  })
  weight: number;

  @ApiProperty({
    description: 'Display color (hex)'
  })
  color: string;

  @ApiProperty({
    description: 'Rarity description'
  })
  description: string;

  @ApiProperty({
    description: 'Number of available templates'
  })
  template_count: number;

  @ApiProperty({
    description: 'Total deployments for this rarity'
  })
  total_deployments: number;
}

export class TemplateStatsDto {
  @ApiProperty({
    description: 'Total number of templates'
  })
  total_templates: number;

  @ApiProperty({
    description: 'Templates by rarity',
    type: 'object'
  })
  by_rarity: Record<string, number>;

  @ApiProperty({
    description: 'Total deployments across all templates'
  })
  total_deployments: number;

  @ApiProperty({
    description: 'Most popular template'
  })
  most_popular: {
    name: string;
    rarity: string;
    deployments: number;
  };

  @ApiProperty({
    description: 'Least deployed template'
  })
  least_deployed: {
    name: string;
    rarity: string;
    deployments: number;
  };
}