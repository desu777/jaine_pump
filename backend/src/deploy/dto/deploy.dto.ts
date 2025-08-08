import { IsString, IsNotEmpty, IsEthereumAddress, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';

export class RecordDeploymentDto {
  @ApiProperty({
    description: 'Contract address of the deployed contract',
    example: '0x1234567890abcdef1234567890abcdef12345678'
  })
  @IsEthereumAddress()
  @IsNotEmpty()
  contract_address: string;

  @ApiProperty({
    description: 'Template name that was deployed',
    example: 'JAINE_LEFT_ME_ON_READ'
  })
  @IsString()
  @IsNotEmpty()
  template_name: string;

  @ApiProperty({
    description: 'Transaction hash of the deployment',
    example: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
  })
  @IsString()
  @IsNotEmpty()
  tx_hash: string;

  @ApiProperty({
    description: 'Block number where transaction was mined',
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  block_number?: number;

  @ApiProperty({
    description: 'Gas used for deployment',
    required: false
  })
  @IsOptional()
  @IsString()
  gas_used?: string;
}

export class DeploymentResponseDto {
  @ApiProperty({
    description: 'Operation success status'
  })
  success: boolean;

  @ApiProperty({
    description: 'Deployment ID'
  })
  deployment_id: string;

  @ApiProperty({
    description: 'Updated user statistics'
  })
  updated_stats: {
    wallet_address: string;
    simp_nick: string;
    total_deploys: number;
    new_rarity_count: number;
    rarity_deployed: string;
    rank_change: number;
    level_up: boolean;
  };

  @ApiProperty({
    description: 'Deployment details'
  })
  deployment: {
    contract_address: string;
    template_name: string;
    rarity: string;
    tx_hash: string;
    deployed_at: string;
  };
}

export class DeploymentStatsDto {
  @ApiProperty({
    description: 'Total deployments across platform'
  })
  total_deployments: number;

  @ApiProperty({
    description: 'Deployments in last 24 hours'
  })
  deployments_24h: number;

  @ApiProperty({
    description: 'Deployments by rarity'
  })
  by_rarity: Record<string, number>;

  @ApiProperty({
    description: 'Most popular templates'
  })
  popular_templates: Array<{
    name: string;
    rarity: string;
    deployments: number;
  }>;

  @ApiProperty({
    description: 'Recent deployments'
  })
  recent_deployments: Array<{
    contract_address: string;
    template_name: string;
    rarity: string;
    simp_nick: string;
    deployed_at: string;
  }>;
}