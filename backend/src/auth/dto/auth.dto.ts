import { IsString, IsNotEmpty, IsEthereumAddress, Length, Matches } from 'class-validator';
import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class GenerateNonceDto {
  @ApiProperty({
    description: 'Ethereum wallet address (checksummed)',
    example: '0x742d35Cc6634C0532925a3b8D4C9db2E04e8b8e8',
    pattern: '^0x[a-fA-F0-9]{40}$'
  })
  @IsEthereumAddress()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase())
  wallet_address: string;
}

export class VerifySignatureDto {
  @ApiProperty({
    description: 'SIWE message that was signed by the wallet',
    example: 'pumpjaine.com wants you to sign in with your Ethereum account...',
    minLength: 50,
    maxLength: 2000
  })
  @IsString()
  @IsNotEmpty()
  @Length(50, 2000, { message: 'Message must be between 50 and 2000 characters' })
  message: string;

  @ApiProperty({
    description: 'Signature from wallet (hex string)',
    example: '0x1234567890abcdef...',
    pattern: '^0x[a-fA-F0-9]{130}$'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{130}$/, { message: 'Invalid signature format' })
  signature: string;
}

export class NonceResponseDto {
  @ApiProperty({
    description: 'Generated nonce for signing',
    example: 'abc123def456'
  })
  nonce: string;

  @ApiProperty({
    description: 'Timestamp when nonce was generated (ISO string)',
    example: '2025-07-30T12:00:00.000Z'
  })
  timestamp: string;
  
  @ApiProperty({
    description: 'Expiration timestamp for the nonce (ISO string)',
    example: '2025-07-30T12:10:00.000Z'
  })
  expires_at: string;

  @ApiProperty({
    description: 'SIWE message template to sign',
    example: 'pumpjaine.com wants you to sign in with your Ethereum account...'
  })
  siwe_message: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Authentication success status'
  })
  success: boolean;

  @ApiProperty({
    description: 'Session access token',
    required: false
  })  
  access_token?: string;

  @ApiProperty({
    description: 'Token expiration time',
    required: false
  })
  expires_at?: string;

  @ApiProperty({
    description: 'User information',
    required: false
  })
  user?: {
    wallet_address: string;
    simp_nick: string;
    total_deploys: number;
    created_at: string;
  };

  @ApiProperty({
    description: 'Error message if authentication failed',
    required: false
  })
  message?: string;
}

export class UserProfileDto {
  @ApiProperty({
    description: 'User wallet address'
  })
  wallet_address: string;

  @ApiProperty({
    description: 'Unique simp nickname'
  })
  simp_nick: string;

  @ApiProperty({
    description: 'Total contract deployments'
  })
  total_deploys: number;

  @ApiProperty({
    description: 'Account creation timestamp'
  })
  created_at: string;

  @ApiProperty({
    description: 'Deployment statistics by rarity'
  })
  deployment_stats: {
    common_deploys: number;
    cope_harder_deploys: number;
    maximum_cope_deploys: number;
    ultimate_rejection_deploys: number;
    ascended_simp_deploys: number;
    legendary_ultra_deploys: number;
  };
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Logout success status'
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message'
  })
  message: string;
}