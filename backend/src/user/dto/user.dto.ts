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
  @ApiProperty({
    description: 'User wallet address'
  })
  wallet_address: string;

  @ApiProperty({
    description: 'Unique simp nickname'
  })
  simp_nick: string;

  @ApiProperty({
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

  @ApiProperty({
    description: 'Account timestamps'
  })
  timestamps: {
    created_at: string;
    updated_at: string;
  };

  @ApiProperty({
    description: 'User rank based on total deployments'
  })
  rank: number;

  @ApiProperty({
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
  @ApiProperty({
    description: 'Leaderboard rank (1-based)'
  })
  rank: number;

  @ApiProperty({
    description: 'User wallet address'
  })
  wallet_address: string;

  @ApiProperty({
    description: 'Simp nickname'
  })
  simp_nick: string;

  @ApiProperty({
    description: 'Total deployments'
  })
  total_deploys: number;

  @ApiProperty({
    description: 'Account age in days'
  })
  account_age_days: number;

  @ApiProperty({
    description: 'Most deployed rarity'
  })
  favorite_rarity: string;

  @ApiProperty({
    description: 'Simp level'
  })
  simp_level: {
    level: number;
    title: string;
  };
}

export class UserDeploymentHistoryDto {
  @ApiProperty({
    description: 'Deployment ID'
  })
  id: string;

  @ApiProperty({
    description: 'Contract address'
  })
  contract_address: string;

  @ApiProperty({
    description: 'Transaction hash'
  })
  tx_hash: string;

  @ApiProperty({
    description: 'Block number'
  })
  block_number: number;

  @ApiProperty({
    description: 'Gas used'
  })
  gas_used: string;

  @ApiProperty({
    description: 'Template information'
  })
  template: {
    name: string;
    rarity: string;
    description: string;
  };

  @ApiProperty({
    description: 'Deployment timestamp'
  })
  deployed_at: string;
}