import { IsEthereumAddress, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({
    description: 'Ethereum wallet address',
    example: '0x742d35Cc6634C0532925a3b8D4C9db2E04e8b8e8'
  })
  @IsEthereumAddress()
  wallet_address: string;
}

export class GetLeaderboardDto {
  @ApiProperty({
    description: 'Number of users to return',
    minimum: 1,
    maximum: 1000,
    default: 100,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 100;
}

export class UserStatsDto {
  @ApiResponseProperty({
    description: 'User wallet address'
  })
  wallet_address: string;

  @ApiResponseProperty({
    description: 'Unique simp nickname'
  })
  simp_nick: string;

  @ApiResponseProperty({
    description: 'Deployment counts by rarity'
  })
  deployment_counts: {
    common_deploys: number;
    cope_harder_deploys: number;
    maximum_cope_deploys: number;
    ultimate_rejection_deploys: number;
    ascended_simp_deploys: number;
    legendary_ultra_deploys: number;
    total_deploys: number;
  };

  @ApiResponseProperty({
    description: 'Account timestamps'
  })
  timestamps: {
    created_at: string;
    updated_at: string;
  };

  @ApiResponseProperty({
    description: 'User rank based on total deployments'
  })
  rank: number;

  @ApiResponseProperty({
    description: 'Simp level based on total deployments'
  })
  simp_level: {
    level: number;
    title: string;
    progress_to_next: number;
    next_level_requirement: number;
  };
}

export class LeaderboardEntryDto {
  @ApiResponseProperty({
    description: 'Leaderboard rank (1-based)'
  })
  rank: number;

  @ApiResponseProperty({
    description: 'User wallet address'
  })
  wallet_address: string;

  @ApiResponseProperty({
    description: 'Simp nickname'
  })
  simp_nick: string;

  @ApiResponseProperty({
    description: 'Total deployments'
  })
  total_deploys: number;

  @ApiResponseProperty({
    description: 'Account age in days'
  })
  account_age_days: number;

  @ApiResponseProperty({
    description: 'Most deployed rarity'
  })
  favorite_rarity: string;

  @ApiResponseProperty({
    description: 'Simp level'
  })
  simp_level: {
    level: number;
    title: string;
  };
}

export class UserDeploymentHistoryDto {
  @ApiResponseProperty({
    description: 'Deployment ID'
  })
  id: string;

  @ApiResponseProperty({
    description: 'Contract address'
  })
  contract_address: string;

  @ApiResponseProperty({
    description: 'Transaction hash'
  })
  tx_hash: string;

  @ApiResponseProperty({
    description: 'Block number'
  })
  block_number: number;

  @ApiResponseProperty({
    description: 'Gas used'
  })
  gas_used: string;

  @ApiResponseProperty({
    description: 'Template information'
  })
  template: {
    name: string;
    rarity: string;
    description: string;
  };

  @ApiResponseProperty({
    description: 'Deployment timestamp'
  })
  deployed_at: string;
}