import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserService } from '../user/user.service';
import { ContractTemplateService } from '../contract-template/contract-template.service';
import { ConfigService } from '../config/config.service';
import { RecordDeploymentDto, DeploymentResponseDto, DeploymentStatsDto } from './dto/deploy.dto';

@Injectable()
export class DeployService {
  private readonly logger = new Logger(DeployService.name);

  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private contractTemplateService: ContractTemplateService,
    private configService: ConfigService,
  ) {}

  /**
   * Record a new contract deployment
   */
  async recordDeployment(
    walletAddress: string,
    recordDto: RecordDeploymentDto,
  ): Promise<DeploymentResponseDto> {
    try {
      // Validate template exists
      const template = await this.contractTemplateService.getTemplateByName(recordDto.template_name);
      
      if (!template) {
        throw new NotFoundException(`Template not found: ${recordDto.template_name}`);
      }

      // Check if deployment already exists
      const existingDeployment = await this.prisma.deployment.findUnique({
        where: { tx_hash: recordDto.tx_hash },
      });

      if (existingDeployment) {
        throw new BadRequestException(`Deployment with tx_hash ${recordDto.tx_hash} already recorded`);
      }

      // Get user's current rank before update
      const currentRank = await this.userService.getUserRank(walletAddress);

      // Record deployment in transaction
      const deployment = await this.prisma.$transaction(async (tx) => {
        // Create deployment record
        const newDeployment = await tx.deployment.create({
          data: {
            wallet_address: walletAddress,
            contract_address: recordDto.contract_address,
            template_id: template.id,
            tx_hash: recordDto.tx_hash,
            block_number: recordDto.block_number,
            gas_used: recordDto.gas_used,
          },
        });

        // Update user deployment counts
        await this.userService.updateDeploymentCount(walletAddress, template.rarity);

        // Update template deployment count
        await this.contractTemplateService.incrementDeploymentCount(template.id);

        return newDeployment;
      });

      // Get updated user stats and rank
      const [updatedUser, newRank] = await Promise.all([
        this.userService.findByWalletAddress(walletAddress),
        this.userService.getUserRank(walletAddress),
      ]);

      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user stats');
      }

      const rankChange = currentRank - newRank;
      const levelUp = this.checkLevelUp(updatedUser.total_deploys - 1, updatedUser.total_deploys);

      if (this.configService.app.testEnv) {
        this.logger.debug(`Recorded deployment for ${updatedUser.simp_nick}`, {
          template: template.name,
          rarity: template.rarity,
          totalDeploys: updatedUser.total_deploys,
          levelUp,
        });
      }

      return {
        success: true,
        deployment_id: deployment.id,
        updated_stats: {
          wallet_address: updatedUser.wallet_address,
          simp_nick: updatedUser.simp_nick,
          total_deploys: updatedUser.total_deploys,
          new_rarity_count: this.getRarityCount(updatedUser, template.rarity),
          rarity_deployed: template.rarity,
          rank_change: rankChange,
          level_up: levelUp,
        },
        deployment: {
          contract_address: deployment.contract_address,
          template_name: template.name,
          rarity: template.rarity,
          tx_hash: deployment.tx_hash,
          deployed_at: deployment.created_at.toISOString(),
        },
      };

    } catch (error) {
      this.logger.error('Failed to record deployment:', {
        error: error.message,
        walletAddress,
        templateName: recordDto.template_name,
      });

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`Failed to record deployment: ${error.message}`);
    }
  }

  /**
   * Get deployment statistics
   */
  async getDeploymentStats(): Promise<DeploymentStatsDto> {
    try {
      const [
        totalDeployments,
        deployments24h,
        deploymentsByRarity,
        popularTemplates,
        recentDeployments,
      ] = await Promise.all([
        this.prisma.deployment.count(),
        this.prisma.deployment.count({
          where: {
            created_at: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
        this.getDeploymentsByRarity(),
        this.getPopularTemplates(),
        this.getRecentDeployments(),
      ]);

      return {
        total_deployments: totalDeployments,
        deployments_24h: deployments24h,
        by_rarity: deploymentsByRarity,
        popular_templates: popularTemplates,
        recent_deployments: recentDeployments,
      };

    } catch (error) {
      this.logger.error('Failed to get deployment stats:', error);
      throw new BadRequestException('Failed to retrieve deployment statistics');
    }
  }

  /**
   * Get deployments by user
   */
  async getUserDeployments(walletAddress: string, limit: number = 50) {
    return this.prisma.deployment.findMany({
      where: { wallet_address: walletAddress },
      include: {
        template: true,
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  /**
   * Get deployment by transaction hash
   */
  async getDeploymentByTxHash(txHash: string) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { tx_hash: txHash },
      include: {
        template: true,
        simp: true,
      },
    });

    if (!deployment) {
      throw new NotFoundException(`Deployment not found for tx_hash: ${txHash}`);
    }

    return deployment;
  }

  /**
   * Get deployment by contract address
   */
  async getDeploymentByContractAddress(contractAddress: string) {
    const deployment = await this.prisma.deployment.findFirst({
      where: { contract_address: contractAddress },
      include: {
        template: true,
        simp: true,
      },
    });

    if (!deployment) {
      throw new NotFoundException(`Deployment not found for contract: ${contractAddress}`);
    }

    return deployment;
  }

  /**
   * Get deployments by template
   */
  async getDeploymentsByTemplate(templateName: string, limit: number = 100) {
    const template = await this.contractTemplateService.getTemplateByName(templateName);
    
    return this.prisma.deployment.findMany({
      where: { template_id: template.id },
      include: {
        simp: true,
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  /**
   * Get deployments by rarity breakdown
   */
  private async getDeploymentsByRarity(): Promise<Record<string, number>> {
    const deploymentsByRarity = await this.prisma.deployment.groupBy({
      by: ['template_id'],
      _count: { id: true },
    });

    const templateRarities = await this.prisma.contractTemplate.findMany({
      select: { id: true, rarity: true },
    });

    const rarityMap = new Map(templateRarities.map(t => [t.id, t.rarity]));
    const result: Record<string, number> = {};

    deploymentsByRarity.forEach(deployment => {
      const rarity = rarityMap.get(deployment.template_id) || 'UNKNOWN';
      result[rarity] = (result[rarity] || 0) + deployment._count.id;
    });

    return result;
  }

  /**
   * Get most popular templates
   */
  private async getPopularTemplates() {
    const templates = await this.prisma.contractTemplate.findMany({
      orderBy: { total_deployments: 'desc' },
      take: 10,
      select: {
        name: true,
        rarity: true,
        total_deployments: true,
      },
    });

    return templates.map(template => ({
      name: template.name,
      rarity: template.rarity,
      deployments: template.total_deployments,
    }));
  }

  /**
   * Get recent deployments
   */
  private async getRecentDeployments() {
    const deployments = await this.prisma.deployment.findMany({
      include: {
        template: true,
        simp: true,
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    return deployments.map(deployment => ({
      contract_address: deployment.contract_address,
      template_name: deployment.template.name,
      rarity: deployment.template.rarity,
      simp_nick: deployment.simp.simp_nick,
      deployed_at: deployment.created_at.toISOString(),
    }));
  }

  /**
   * Check if user leveled up
   */
  private checkLevelUp(previousDeploys: number, currentDeploys: number): boolean {
    const levelThresholds = [0, 5, 15, 30, 50, 100, 200, 500, 1000, 10000];
    
    const previousLevel = levelThresholds.findIndex(threshold => previousDeploys < threshold) - 1;
    const currentLevel = levelThresholds.findIndex(threshold => currentDeploys < threshold) - 1;
    
    return currentLevel > previousLevel;
  }

  /**
   * Get count for specific rarity from user stats
   */
  private getRarityCount(user: any, rarity: string): number {
    const rarityFieldMap: Record<string, string> = {
      COMMON: 'common_deploys',
      COPE_HARDER: 'cope_harder_deploys',
      MAXIMUM_COPE: 'maximum_cope_deploys',
      ULTIMATE_REJECTION: 'ultimate_rejection_deploys',
      ASCENDED_SIMP: 'ascended_simp_deploys',
      LEGENDARY_ULTRA: 'legendary_ultra_deploys',
    };

    const field = rarityFieldMap[rarity];
    return field ? user[field] : 0;
  }
}