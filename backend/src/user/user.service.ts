import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '../config/config.service';
import { CreateUserDto, UserStatsDto, LeaderboardEntryDto, UserDeploymentHistoryDto } from './dto/user.dto';

export interface UserStats {
  wallet_address: string;
  simp_nick: string;
  common_deploys: number;
  cope_harder_deploys: number;
  maximum_cope_deploys: number;
  ultimate_rejection_deploys: number;
  ascended_simp_deploys: number;
  legendary_ultra_deploys: number;
  total_deploys: number;
  created_at: Date;
  updated_at: Date;
}

export interface SimpLevel {
  level: number;
  title: string;
  min_deploys: number;
  max_deploys: number;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  private readonly simpLevels: SimpLevel[] = [
    { level: 1, title: 'Rookie Simp', min_deploys: 0, max_deploys: 4 },
    { level: 2, title: 'Amateur Simp', min_deploys: 5, max_deploys: 14 },
    { level: 3, title: 'Professional Simp', min_deploys: 15, max_deploys: 29 },
    { level: 4, title: 'Elite Simp', min_deploys: 30, max_deploys: 49 },
    { level: 5, title: 'Master Simp', min_deploys: 50, max_deploys: 99 },
    { level: 6, title: 'Legendary Simp', min_deploys: 100, max_deploys: 199 },
    { level: 7, title: 'Mythical Simp', min_deploys: 200, max_deploys: 499 },
    { level: 8, title: 'Ascended Simp', min_deploys: 500, max_deploys: 999 },
    { level: 9, title: 'Transcendent Simp', min_deploys: 1000, max_deploys: 9999 },
    { level: 10, title: 'Ultimate Simp Lord', min_deploys: 10000, max_deploys: Infinity },
  ];

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Create a new user (simp)
   */
  async create(createUserDto: CreateUserDto): Promise<UserStats> {
    const { wallet_address } = createUserDto;
    const simp_nick = this.prisma.generateSimpNick(wallet_address);

    const user = await this.prisma.simp.create({
      data: {
        wallet_address,
        simp_nick,
      },
    });

    if (this.configService.app.testEnv) {
      this.logger.debug(`Created new simp: ${simp_nick}`);
    }

    return user;
  }

  /**
   * Find user by wallet address
   */
  async findByWalletAddress(wallet_address: string): Promise<UserStats | null> {
    return this.prisma.simp.findUnique({
      where: { wallet_address },
    });
  }

  /**
   * Find user by simp nick
   */
  async findBySimpNick(simp_nick: string): Promise<UserStats | null> {
    return this.prisma.simp.findUnique({
      where: { simp_nick },
    });
  }

  /**
   * Get detailed user statistics
   */
  async getUserStats(wallet_address: string): Promise<UserStatsDto> {
    const user = await this.findByWalletAddress(wallet_address);
    
    if (!user) {
      throw new NotFoundException(`User not found: ${wallet_address}`);
    }

    const rank = await this.getUserRank(wallet_address);
    const simpLevel = this.calculateSimpLevel(user.total_deploys);

    return {
      wallet_address: user.wallet_address,
      simp_nick: user.simp_nick,
      deployment_counts: {
        common_deploys: user.common_deploys,
        cope_harder_deploys: user.cope_harder_deploys,
        maximum_cope_deploys: user.maximum_cope_deploys,
        ultimate_rejection_deploys: user.ultimate_rejection_deploys,
        ascended_simp_deploys: user.ascended_simp_deploys,
        legendary_ultra_deploys: user.legendary_ultra_deploys,
        total_deploys: user.total_deploys,
      },
      timestamps: {
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString(),
      },
      rank,
      simp_level: simpLevel,
    };
  }

  /**
   * Update deployment count for specific rarity
   */
  async updateDeploymentCount(wallet_address: string, rarity: string): Promise<UserStats> {
    const rarityFieldMap: Record<string, string> = {
      COMMON: 'common_deploys',
      COPE_HARDER: 'cope_harder_deploys',
      MAXIMUM_COPE: 'maximum_cope_deploys',
      ULTIMATE_REJECTION: 'ultimate_rejection_deploys',
      ASCENDED_SIMP: 'ascended_simp_deploys',
      LEGENDARY_ULTRA: 'legendary_ultra_deploys',
    };

    const field = rarityFieldMap[rarity];
    if (!field) {
      throw new Error(`Invalid rarity: ${rarity}`);
    }

    const updatedUser = await this.prisma.simp.update({
      where: { wallet_address },
      data: {
        [field]: {
          increment: 1,
        },
        total_deploys: {
          increment: 1,
        },
      },
    });

    if (this.configService.app.testEnv) {
      this.logger.debug(`Updated ${wallet_address}: ${rarity} deployment (+1)`);
    }

    return updatedUser;
  }

  /**
   * Get leaderboard (top simps)
   */
  async getLeaderboard(limit: number = 100): Promise<LeaderboardEntryDto[]> {
    const users = await this.prisma.simp.findMany({
      take: limit,
      orderBy: [
        { total_deploys: 'desc' },
        { created_at: 'asc' }, // Earlier users rank higher in ties
      ],
    });

    return users.map((user, index) => {
      const accountAgeDays = Math.floor(
        (Date.now() - user.created_at.getTime()) / (1000 * 60 * 60 * 24)
      );

      const favoriteRarity = this.getFavoriteRarity(user);
      const simpLevel = this.calculateSimpLevel(user.total_deploys);

      return {
        rank: index + 1,
        wallet_address: user.wallet_address,
        simp_nick: user.simp_nick,
        total_deploys: user.total_deploys,
        account_age_days: accountAgeDays,
        favorite_rarity: favoriteRarity,
        simp_level: {
          level: simpLevel.level,
          title: simpLevel.title,
        },
      };
    });
  }

  /**
   * Get user rank
   */
  async getUserRank(wallet_address: string): Promise<number> {
    const user = await this.findByWalletAddress(wallet_address);
    
    if (!user) {
      throw new NotFoundException(`User not found: ${wallet_address}`);
    }

    const rank = await this.prisma.simp.count({
      where: {
        OR: [
          { total_deploys: { gt: user.total_deploys } },
          {
            total_deploys: user.total_deploys,
            created_at: { lt: user.created_at },
          },
        ],
      },
    });

    return rank + 1;
  }

  /**
   * Get deployment history for user
   */
  async getDeploymentHistory(wallet_address: string): Promise<UserDeploymentHistoryDto[]> {
    const deployments = await this.prisma.deployment.findMany({
      where: { wallet_address },
      include: {
        template: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 100, // Limit to last 100 deployments
    });

    return deployments.map(deployment => ({
      id: deployment.id,
      contract_address: deployment.contract_address,
      tx_hash: deployment.tx_hash,
      block_number: deployment.block_number || 0,
      gas_used: deployment.gas_used || '0',
      template: {
        name: deployment.template.name,
        rarity: deployment.template.rarity,
        description: deployment.template.description || '',
      },
      deployed_at: deployment.created_at.toISOString(),
    }));
  }

  /**
   * Check if user exists
   */
  async exists(wallet_address: string): Promise<boolean> {
    const user = await this.findByWalletAddress(wallet_address);
    return !!user;
  }

  /**
   * Get total user count
   */
  async getTotalUserCount(): Promise<number> {
    return this.prisma.simp.count();
  }

  /**
   * Get user statistics summary
   */
  async getUserStatsSummary() {
    const [totalUsers, totalDeployments, avgDeployments, topSimp] = await Promise.all([
      this.prisma.simp.count(),
      this.prisma.simp.aggregate({
        _sum: { total_deploys: true },
      }),
      this.prisma.simp.aggregate({
        _avg: { total_deploys: true },
      }),
      this.prisma.simp.findFirst({
        orderBy: [
          { total_deploys: 'desc' },
          { created_at: 'asc' },
        ],
        select: {
          simp_nick: true,
          total_deploys: true,
        },
      }),
    ]);

    return {
      total_users: totalUsers,
      total_deployments: totalDeployments._sum.total_deploys || 0,
      average_deployments: Math.round((avgDeployments._avg.total_deploys || 0) * 100) / 100,
      top_simp: {
        nick: topSimp?.simp_nick || 'N/A',
        deployments: topSimp?.total_deploys || 0,
      },
    };
  }

  /**
   * Calculate simp level based on total deployments
   */
  private calculateSimpLevel(totalDeploys: number) {
    const level = this.simpLevels.find(l => 
      totalDeploys >= l.min_deploys && totalDeploys <= l.max_deploys
    ) || this.simpLevels[this.simpLevels.length - 1];

    const nextLevel = this.simpLevels.find(l => l.level === level.level + 1);
    const progressToNext = nextLevel 
      ? Math.max(0, totalDeploys - level.min_deploys)
      : 0;
    
    const nextLevelRequirement = nextLevel?.min_deploys || level.max_deploys;

    return {
      level: level.level,
      title: level.title,
      progress_to_next: progressToNext,
      next_level_requirement: nextLevelRequirement,
    };
  }

  /**
   * Get user's favorite rarity (most deployed)
   */
  private getFavoriteRarity(user: UserStats): string {
    const rarityDeployments = {
      COMMON: user.common_deploys,
      COPE_HARDER: user.cope_harder_deploys,
      MAXIMUM_COPE: user.maximum_cope_deploys,
      ULTIMATE_REJECTION: user.ultimate_rejection_deploys,
      ASCENDED_SIMP: user.ascended_simp_deploys,
      LEGENDARY_ULTRA: user.legendary_ultra_deploys,
    };

    return Object.entries(rarityDeployments)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'COMMON';
  }
}