import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserService } from './user.service';
import { 
  UserStatsDto, 
  LeaderboardEntryDto, 
  UserDeploymentHistoryDto,
  GetLeaderboardDto 
} from './dto/user.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(SessionAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get current user statistics',
    description: 'Returns detailed statistics for the authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User statistics', 
    type: UserStatsDto 
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getCurrentUserStats(@CurrentUser('wallet_address') walletAddress: string): Promise<UserStatsDto> {
    return this.userService.getUserStats(walletAddress);
  }

  @Get('me/history')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get current user deployment history',
    description: 'Returns the deployment history for the authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User deployment history', 
    type: [UserDeploymentHistoryDto] 
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async getCurrentUserHistory(@CurrentUser('wallet_address') walletAddress: string): Promise<UserDeploymentHistoryDto[]> {
    return this.userService.getDeploymentHistory(walletAddress);
  }

  @Public()
  @Get('leaderboard')
  @ApiOperation({ 
    summary: 'Get simp leaderboard',
    description: 'Returns the top simps ranked by total deployments'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Leaderboard entries', 
    type: [LeaderboardEntryDto] 
  })
  async getLeaderboard(@Query() query: GetLeaderboardDto): Promise<LeaderboardEntryDto[]> {
    return this.userService.getLeaderboard(query.limit);
  }

  @Public()
  @Get('stats/summary')
  @ApiOperation({ 
    summary: 'Get user statistics summary',
    description: 'Returns overall platform statistics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Platform statistics',
    schema: {
      type: 'object',
      properties: {
        total_users: { type: 'number' },
        total_deployments: { type: 'number' },
        average_deployments: { type: 'number' },
        top_simp: {
          type: 'object',
          properties: {
            nick: { type: 'string' },
            deployments: { type: 'number' }
          }
        }
      }
    }
  })
  async getUserStatsSummary() {
    return this.userService.getUserStatsSummary();
  }

  @Public()
  @Get(':address')
  @ApiOperation({ 
    summary: 'Get user statistics by wallet address',
    description: 'Returns detailed statistics for a specific user'
  })
  @ApiParam({ name: 'address', description: 'User wallet address' })
  @ApiResponse({ 
    status: 200, 
    description: 'User statistics', 
    type: UserStatsDto 
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserStats(@Param('address') address: string): Promise<UserStatsDto> {
    return this.userService.getUserStats(address);
  }

  @Public()
  @Get(':address/history')
  @ApiOperation({ 
    summary: 'Get user deployment history by wallet address',
    description: 'Returns deployment history for a specific user'
  })
  @ApiParam({ name: 'address', description: 'User wallet address' })
  @ApiResponse({ 
    status: 200, 
    description: 'User deployment history', 
    type: [UserDeploymentHistoryDto] 
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserHistory(@Param('address') address: string): Promise<UserDeploymentHistoryDto[]> {
    return this.userService.getDeploymentHistory(address);
  }

  @Public()
  @Get(':address/rank')
  @ApiOperation({ 
    summary: 'Get user rank by wallet address',
    description: 'Returns the current rank of a specific user'
  })
  @ApiParam({ name: 'address', description: 'User wallet address' })
  @ApiResponse({ 
    status: 200, 
    description: 'User rank',
    schema: {
      type: 'object',
      properties: {
        wallet_address: { type: 'string' },
        simp_nick: { type: 'string' },
        rank: { type: 'number' },
        total_deploys: { type: 'number' },
        percentile: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserRank(@Param('address') address: string) {
    const [user, rank, totalUsers] = await Promise.all([
      this.userService.findByWalletAddress(address),
      this.userService.getUserRank(address),
      this.userService.getTotalUserCount(),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    const percentile = totalUsers > 0 ? Math.round((1 - (rank - 1) / totalUsers) * 100) : 0;

    return {
      wallet_address: user.wallet_address,
      simp_nick: user.simp_nick,
      rank,
      total_deploys: user.total_deploys,
      percentile,
    };
  }
}