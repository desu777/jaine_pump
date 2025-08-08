import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RarityService, RaritySelection } from './rarity.service';
import { ConfigService } from '../config/config.service';
import { ContractTemplateDto, GetRandomTemplateDto, TemplateStatsDto } from './dto/contract-template.dto';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface ContractTemplate {
  id: number;
  name: string;
  rarity: string;
  file_path: string;
  description?: string | null;
  total_deployments: number;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class ContractTemplateService {
  private readonly logger = new Logger(ContractTemplateService.name);
  private readonly contractsBasePath = join(process.cwd(), 'contracts');
  
  constructor(
    private prisma: PrismaService,
    private rarityService: RarityService,
    private configService: ConfigService,
  ) {}

  // Removed onModuleInit due to ConfigService injection issues during initialization
  // Seeding can be done manually or via a separate endpoint if needed

  /**
   * Get random contract template based on rarity weights
   */
  async getRandomTemplate(dto?: GetRandomTemplateDto): Promise<ContractTemplate> {
    try {
      let selectedRarity: string;

      if (dto?.rarity) {
        // Use specified rarity
        if (!this.rarityService.isValidRarity(dto.rarity)) {
          throw new NotFoundException(`Invalid rarity: ${dto.rarity}`);
        }
        selectedRarity = dto.rarity;
      } else {
        // Select random rarity based on weights
        const raritySelection = this.rarityService.selectRandomRarity(dto?.user_address);
        selectedRarity = raritySelection.rarity;

        if (this.configService.app.testEnv) {
          this.logger.debug(`Selected rarity: ${selectedRarity}`, {
            roll: raritySelection.roll,
            isLucky: raritySelection.is_lucky,
          });
        }
      }

      return this.getRandomTemplateByRarity(selectedRarity);

    } catch (error) {
      this.logger.error('Failed to get random template:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      // Fallback to common rarity
      return this.getRandomTemplateByRarity('COMMON');
    }
  }

  /**
   * Get random template by specific rarity
   */
  async getRandomTemplateByRarity(rarity: string): Promise<ContractTemplate> {
    const templates = await this.prisma.contractTemplate.findMany({
      where: { rarity },
    });
    
    if (templates.length === 0) {
      throw new NotFoundException(`No templates found for rarity: ${rarity}`);
    }
    
    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  }

  /**
   * Get template by name
   */
  async getTemplateByName(name: string): Promise<ContractTemplate> {
    const template = await this.prisma.contractTemplate.findUnique({
      where: { name },
    });
    
    if (!template) {
      throw new NotFoundException(`Template not found: ${name}`);
    }
    
    return template;
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: number): Promise<ContractTemplate> {
    const template = await this.prisma.contractTemplate.findUnique({
      where: { id },
    });
    
    if (!template) {
      throw new NotFoundException(`Template not found with ID: ${id}`);
    }
    
    return template;
  }

  /**
   * Get all templates
   */
  async getAllTemplates(): Promise<ContractTemplate[]> {
    return this.prisma.contractTemplate.findMany({
      orderBy: [
        { rarity: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  /**
   * Get templates by rarity
   */
  async getTemplatesByRarity(rarity: string): Promise<ContractTemplate[]> {
    if (!this.rarityService.isValidRarity(rarity)) {
      throw new NotFoundException(`Invalid rarity: ${rarity}`);
    }

    return this.prisma.contractTemplate.findMany({
      where: { rarity },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Read contract source code
   */
  async getContractSource(template: ContractTemplate): Promise<string> {
    try {
      if (!existsSync(template.file_path)) {
        throw new NotFoundException(`Contract source file not found: ${template.file_path}`);
      }

      return readFileSync(template.file_path, 'utf8');
    } catch (error) {
      this.logger.error(`Failed to read contract source: ${template.file_path}`, error);
      throw new NotFoundException(`Failed to read contract source: ${template.name}`);
    }
  }

  /**
   * Increment deployment count
   */
  async incrementDeploymentCount(templateId: number): Promise<ContractTemplate> {
    return this.prisma.contractTemplate.update({
      where: { id: templateId },
      data: {
        total_deployments: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(): Promise<TemplateStatsDto> {
    const [templates, deploymentStats] = await Promise.all([
      this.prisma.contractTemplate.findMany(),
      this.prisma.contractTemplate.groupBy({
        by: ['rarity'],
        _count: { id: true },
        _sum: { total_deployments: true },
      }),
    ]);

    const totalTemplates = templates.length;
    const totalDeployments = templates.reduce((sum, t) => sum + t.total_deployments, 0);

    // Group by rarity
    const byRarity: Record<string, number> = {};
    deploymentStats.forEach(stat => {
      byRarity[stat.rarity] = stat._count.id;
    });

    // Find most and least popular
    const sortedByDeployments = templates.sort((a, b) => b.total_deployments - a.total_deployments);
    const mostPopular = sortedByDeployments[0];
    const leastDeployed = sortedByDeployments[sortedByDeployments.length - 1];

    return {
      total_templates: totalTemplates,
      by_rarity: byRarity,
      total_deployments: totalDeployments,
      most_popular: {
        name: mostPopular?.name || 'N/A',
        rarity: mostPopular?.rarity || 'N/A',
        deployments: mostPopular?.total_deployments || 0,
      },
      least_deployed: {
        name: leastDeployed?.name || 'N/A',
        rarity: leastDeployed?.rarity || 'N/A',
        deployments: leastDeployed?.total_deployments || 0,
      },
    };
  }

  /**
   * Search templates by name or description
   */
  async searchTemplates(query: string): Promise<ContractTemplate[]> {
    return this.prisma.contractTemplate.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      },
      orderBy: { total_deployments: 'desc' },
    });
  }

  /**
   * Get rarity distribution
   */
  async getRarityDistribution(): Promise<Array<{
    rarity: string;
    name: string;
    template_count: number;
    total_deployments: number;
    weight: number;
    color: string;
  }>> {
    const stats = await this.prisma.contractTemplate.groupBy({
      by: ['rarity'],
      _count: { id: true },
      _sum: { total_deployments: true },
    });

    const rarityConfigs = this.rarityService.getRarityConfigs();

    return stats.map(stat => {
      const config = rarityConfigs[stat.rarity];
      return {
        rarity: stat.rarity,
        name: config?.name || stat.rarity,
        template_count: stat._count.id,
        total_deployments: stat._sum.total_deployments || 0,
        weight: config?.weight || 0,
        color: config?.color || '#9CA3AF',
      };
    });
  }

  /**
   * Seed contract templates if database is empty
   */
  private async seedTemplatesIfNeeded(): Promise<void> {
    const existingCount = await this.prisma.contractTemplate.count();
    
    if (existingCount > 0) {
      if (this.configService.app.testEnv) {
        this.logger.debug(`Found ${existingCount} existing templates, skipping seed`);
      }
      return;
    }

    this.logger.log('Seeding contract templates...');
    await this.seedContractTemplates();
  }

  /**
   * Seed all contract templates
   */
  private async seedContractTemplates(): Promise<void> {
    const templateDefinitions = this.getTemplateDefinitions();

    for (const template of templateDefinitions) {
      try {
        await this.prisma.contractTemplate.create({
          data: template,
        });
        
        if (this.configService.app.testEnv) {
          this.logger.debug(`✅ Seeded: ${template.name} (${template.rarity})`);
        }
      } catch (error) {
        this.logger.error(`Failed to seed template ${template.name}:`, error);
      }
    }

    this.logger.log(`✅ Seeded ${templateDefinitions.length} contract templates`);
  }

  /**
   * Get template definitions for seeding
   */
  private getTemplateDefinitions() {
    return [
      // COMMON (50%)
      {
        name: 'JAINE_LEFT_ME_ON_READ',
        rarity: 'COMMON',
        file_path: join(this.contractsBasePath, 'common', 'JAINE_LEFT_ME_ON_READ.sol'),
        description: 'The classic double blue tick scenario - seen but ignored',
      },
      {
        name: 'JAINE_BLOCKED_ME',
        rarity: 'COMMON',
        file_path: join(this.contractsBasePath, 'common', 'JAINE_BLOCKED_ME.sol'),
        description: 'When you cross the line from simp to stalker',
      },
      {
        name: 'JAINE_GHOSTED_ME',
        rarity: 'COMMON',
        file_path: join(this.contractsBasePath, 'common', 'JAINE_GHOSTED_ME.sol'),
        description: 'Complete radio silence after showing interest',
      },

      // COPE_HARDER (25%)
      {
        name: 'JAINE_FRIENDZONED_ME',
        rarity: 'COPE_HARDER',
        file_path: join(this.contractsBasePath, 'cope-harder', 'JAINE_FRIENDZONED_ME.sol'),
        description: 'The devastating "let\'s just be friends" NFT collection',
      },
      {
        name: 'JAINE_PICKED_CHAD',
        rarity: 'COPE_HARDER',
        file_path: join(this.contractsBasePath, 'cope-harder', 'JAINE_PICKED_CHAD.sol'),
        description: 'She chose the obvious alpha over you',
      },
      {
        name: 'JAINE_TEXTED_BACK_K',
        rarity: 'COPE_HARDER',
        file_path: join(this.contractsBasePath, 'cope-harder', 'JAINE_TEXTED_BACK_K.sol'),
        description: 'The most devastating single letter response',
      },

      // MAXIMUM_COPE (15%)
      {
        name: 'JAINE_SAID_EW',
        rarity: 'MAXIMUM_COPE',
        file_path: join(this.contractsBasePath, 'maximum-cope', 'JAINE_SAID_EW.sol'),
        description: 'Instant soul destruction with a single word',
      },
      {
        name: 'JAINE_POSTED_ANOTHER_GUY',
        rarity: 'MAXIMUM_COPE',
        file_path: join(this.contractsBasePath, 'maximum-cope', 'JAINE_POSTED_ANOTHER_GUY.sol'),
        description: 'Social media announcement of your replacement',
      },
      {
        name: 'JAINE_SAID_IM_TOO_SHORT',
        rarity: 'MAXIMUM_COPE',
        file_path: join(this.contractsBasePath, 'maximum-cope', 'JAINE_SAID_IM_TOO_SHORT.sol'),
        description: 'Height discrimination in its purest form',
      },

      // ULTIMATE_REJECTION (7%)
      {
        name: 'JAINE_MARRIED_MY_BULLY',
        rarity: 'ULTIMATE_REJECTION',
        file_path: join(this.contractsBasePath, 'ultimate-rejection', 'JAINE_MARRIED_MY_BULLY.sol'),
        description: 'The ultimate betrayal - she married your high school tormentor',
      },
      {
        name: 'JAINE_LAUGHED_AT_MY_PORTFOLIO',
        rarity: 'ULTIMATE_REJECTION',
        file_path: join(this.contractsBasePath, 'ultimate-rejection', 'JAINE_LAUGHED_AT_MY_PORTFOLIO.sol'),
        description: 'Financial humiliation on top of romantic rejection',
      },
      {
        name: 'JAINE_SAID_TOUCH_GRASS',
        rarity: 'ULTIMATE_REJECTION',
        file_path: join(this.contractsBasePath, 'ultimate-rejection', 'JAINE_SAID_TOUCH_GRASS.sol'),
        description: 'The internet\'s way of telling you to get a life',
      },
      {
        name: 'JAINE_RESTRAINING_ORDER',
        rarity: 'ULTIMATE_REJECTION',
        file_path: join(this.contractsBasePath, 'ultimate-rejection', 'JAINE_RESTRAINING_ORDER.sol'),
        description: 'Legal action - the ultimate rejection',
      },
      {
        name: 'JAINE_CALLED_SECURITY',
        rarity: 'ULTIMATE_REJECTION',
        file_path: join(this.contractsBasePath, 'ultimate-rejection', 'JAINE_CALLED_SECURITY.sol'),
        description: 'When your presence becomes a security threat',
      },

      // ASCENDED_SIMP (2.5%)
      {
        name: 'JAINE_WILL_NOTICE_ME_SOMEDAY',
        rarity: 'ASCENDED_SIMP',
        file_path: join(this.contractsBasePath, 'ascended-simp', 'JAINE_WILL_NOTICE_ME_SOMEDAY.sol'),
        description: 'Eternal optimism in the face of crushing reality',
      },

      // LEGENDARY_ULTRA (0.5%)
      {
        name: 'JAINE_ACTUALLY_REPLIED',
        rarity: 'LEGENDARY_ULTRA',
        file_path: join(this.contractsBasePath, 'legendary-ultra', 'JAINE_ACTUALLY_REPLIED.sol'),
        description: 'The rarest event in the universe - she actually responded',
      },
      {
        name: 'MARRY_JAINE',
        rarity: 'LEGENDARY_ULTRA',
        file_path: join(this.contractsBasePath, 'legendary-ultra', 'MARRY_JAINE.sol'),
        description: 'The impossible dream - actual success (spoiler: it\'s a bug)',
      },
    ];
  }
}