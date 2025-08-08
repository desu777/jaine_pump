import { Controller, Post, Body, UseGuards, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { 
  GenerateNonceDto, 
  VerifySignatureDto, 
  AuthResponseDto, 
  NonceResponseDto, 
  UserProfileDto,
  LogoutResponseDto 
} from './dto/auth.dto';

@ApiTags('auth')
@ApiExtraModels(GenerateNonceDto, VerifySignatureDto, AuthResponseDto, NonceResponseDto, UserProfileDto, LogoutResponseDto)
@Controller('auth')
@UseGuards(SessionAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('nonce')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Generate nonce for SIWE authentication',
    description: 'Creates a unique nonce and SIWE message template for wallet signature'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Nonce generated successfully with SIWE message', 
    type: NonceResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid wallet address format' })
  @ApiResponse({ status: 500, description: 'Failed to generate nonce' })
  async generateNonce(@Body() generateNonceDto: GenerateNonceDto): Promise<NonceResponseDto> {
    return this.authService.generateNonce(generateNonceDto);
  }

  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify SIWE signature and authenticate',
    description: 'Verifies the signed SIWE message and returns JWT token for authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Authentication successful', 
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid signature or message format' })
  @ApiResponse({ status: 401, description: 'Invalid or expired nonce' })
  async verifySignature(@Body() verifySignatureDto: VerifySignatureDto): Promise<AuthResponseDto> {
    return this.authService.verifySignature(verifySignatureDto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get current authenticated user profile',
    description: 'Returns detailed profile information for the authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Current user profile information', 
    type: UserProfileDto 
  })
  @ApiResponse({ status: 401, description: 'Not authenticated or invalid token' })
  async getProfile(@CurrentUser() user: any): Promise<UserProfileDto> {
    return {
      wallet_address: user.wallet_address,
      simp_nick: user.simp_nick,
      total_deploys: user.total_deploys,
      created_at: user.created_at.toISOString(),
      deployment_stats: {
        common_deploys: user.common_deploys,
        cope_harder_deploys: user.cope_harder_deploys,
        maximum_cope_deploys: user.maximum_cope_deploys,
        ultimate_rejection_deploys: user.ultimate_rejection_deploys,
        ascended_simp_deploys: user.ascended_simp_deploys,
        legendary_ultra_deploys: user.legendary_ultra_deploys,
      },
    };
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Logout and invalidate sessions',
    description: 'Invalidates all active sessions for the authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Logged out successfully', 
    type: LogoutResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 400, description: 'Logout failed' })
  async logout(@CurrentUser('wallet_address') walletAddress: string): Promise<LogoutResponseDto> {
    return this.authService.logout(walletAddress);
  }

  @Public()
  @Get('siwe-template')
  @ApiOperation({ 
    summary: 'Get SIWE message template and instructions',
    description: 'Returns the SIWE message template with placeholders and signing instructions'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'SIWE message template and instructions',
    schema: {
      type: 'object',
      properties: {
        template: { type: 'string', description: 'SIWE message template with placeholders' },
        placeholders: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'List of placeholders to replace'
        },
        instructions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Step-by-step authentication instructions'
        }
      }
    }
  })
  getSiweMessageTemplate() {
    return this.authService.getSiweMessageTemplate();
  }

  @Public()
  @Get('health')
  @ApiOperation({ 
    summary: 'Authentication service health check',
    description: 'Check if authentication service is operational'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', format: 'date-time' },
        version: { type: 'string', example: '1.0.0' }
      }
    }
  })
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        jwt: 'operational',
        siwe: 'operational',
        database: 'operational',
      },
    };
  }
}