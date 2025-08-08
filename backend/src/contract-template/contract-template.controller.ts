import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ContractTemplateService } from './contract-template.service';
import { RarityService } from './rarity.service';
import { 
  ContractTemplateDto, 
  GetRandomTemplateDto, 
  RarityConfigDto,
  TemplateStatsDto,
  RarityType 
} from './dto/contract-template.dto';

@ApiTags('contract-templates')
@Controller('contract-templates')
@UseGuards(SessionAuthGuard)
export class ContractTemplateController {
  constructor(
    private readonly contractTemplateService: ContractTemplateService,
    private readonly rarityService: RarityService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ 
    summary: 'Get all contract templates',
    description: 'Returns a list of all available contract templates sorted by rarity and name'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of contract templates', 
    type: [ContractTemplateDto] 
  })
  async getAllTemplates(): Promise<ContractTemplateDto[]> {
    const templates = await this.contractTemplateService.getAllTemplates();
    
    return templates.map(template => ({
      id: template.id,
      name: template.name,
      rarity: template.rarity as RarityType,
      file_path: template.file_path,
      description: template.description || '',
      total_deployments: template.total_deployments,
      created_at: template.created_at.toISOString(),
      updated_at: template.updated_at.toISOString(),
    }));
  }

  @Get('random')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get random contract template',
    description: 'Returns a randomly selected contract template based on rarity weights'
  })
  @ApiQuery({ name: 'rarity', enum: RarityType, required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Random contract template', 
    type: ContractTemplateDto 
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 404, description: 'No templates found for specified rarity' })
  async getRandomTemplate(
    @Query('rarity') rarity?: RarityType,
    @CurrentUser('wallet_address') userAddress?: string,
  ): Promise<ContractTemplateDto> {
    const dto: GetRandomTemplateDto = {
      rarity,
      user_address: userAddress,
    };

    const template = await this.contractTemplateService.getRandomTemplate(dto);
    
    return {
      id: template.id,
      name: template.name,
      rarity: template.rarity as RarityType,
      file_path: template.file_path,
      description: template.description || '',
      total_deployments: template.total_deployments,
      created_at: template.created_at.toISOString(),
      updated_at: template.updated_at.toISOString(),
    };
  }

  @Public()
  @Get('rarities')
  @ApiOperation({ 
    summary: 'Get rarity configurations',
    description: 'Returns all rarity configurations with weights, colors, and descriptions'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rarity configurations',
    type: 'object',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          weight: { type: 'number' },
          color: { type: 'string' },
          description: { type: 'string' },
          template_count: { type: 'number' },
          total_deployments: { type: 'number' }
        }
      }
    }
  })
  async getRarityConfigs(): Promise<Record<string, RarityConfigDto>> {
    const [rarityConfigs, distribution] = await Promise.all([
      this.rarityService.getRarityConfigs(),
      this.contractTemplateService.getRarityDistribution(),
    ]);

    const result: Record<string, RarityConfigDto> = {};

    Object.entries(rarityConfigs).forEach(([key, config]) => {
      const distData = distribution.find(d => d.rarity === key);
      
      result[key] = {
        name: config.name,
        weight: config.weight,
        color: config.color,
        description: config.description,
        template_count: distData?.template_count || 0,
        total_deployments: distData?.total_deployments || 0,
      };
    });

    return result;
  }

  @Public()
  @Get('stats')
  @ApiOperation({ 
    summary: 'Get template statistics',
    description: 'Returns comprehensive statistics about contract templates and deployments'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Template statistics', 
    type: TemplateStatsDto 
  })
  async getTemplateStats(): Promise<TemplateStatsDto> {
    return this.contractTemplateService.getTemplateStats();
  }

  @Public()
  @Get('rarity/:rarity')
  @ApiOperation({ 
    summary: 'Get templates by rarity',
    description: 'Returns all contract templates of a specific rarity level'
  })
  @ApiParam({ name: 'rarity', enum: RarityType })
  @ApiResponse({ 
    status: 200, 
    description: 'Templates of specified rarity', 
    type: [ContractTemplateDto] 
  })
  @ApiResponse({ status: 404, description: 'Invalid rarity specified' })
  async getTemplatesByRarity(@Param('rarity') rarity: RarityType): Promise<ContractTemplateDto[]> {
    const templates = await this.contractTemplateService.getTemplatesByRarity(rarity);
    
    return templates.map(template => ({
      id: template.id,
      name: template.name,
      rarity: template.rarity as RarityType,
      file_path: template.file_path,
      description: template.description || '',
      total_deployments: template.total_deployments,
      created_at: template.created_at.toISOString(),
      updated_at: template.updated_at.toISOString(),
    }));
  }

  @Public()
  @Get('search')
  @ApiOperation({ 
    summary: 'Search contract templates',
    description: 'Search templates by name or description'
  })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results', 
    type: [ContractTemplateDto] 
  })
  async searchTemplates(@Query('q') query: string): Promise<ContractTemplateDto[]> {
    const templates = await this.contractTemplateService.searchTemplates(query);
    
    return templates.map(template => ({
      id: template.id,
      name: template.name,
      rarity: template.rarity as RarityType,
      file_path: template.file_path,
      description: template.description || '',
      total_deployments: template.total_deployments,
      created_at: template.created_at.toISOString(),
      updated_at: template.updated_at.toISOString(),
    }));
  }

  @Public()
  @Get(':name')
  @ApiOperation({ 
    summary: 'Get contract template by name',
    description: 'Returns detailed information about a specific contract template'
  })
  @ApiParam({ name: 'name', description: 'Contract template name' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contract template details', 
    type: ContractTemplateDto 
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplateByName(@Param('name') name: string): Promise<ContractTemplateDto> {
    const template = await this.contractTemplateService.getTemplateByName(name);
    
    return {
      id: template.id,
      name: template.name,
      rarity: template.rarity as RarityType,
      file_path: template.file_path,
      description: template.description || '',
      total_deployments: template.total_deployments,
      created_at: template.created_at.toISOString(),
      updated_at: template.updated_at.toISOString(),
    };
  }

  @Public()
  @Get(':name/source')
  @ApiOperation({ 
    summary: 'Get contract source code',
    description: 'Returns the Solidity source code for a contract template'
  })
  @ApiParam({ name: 'name', description: 'Contract template name' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contract source code',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        rarity: { type: 'string' },
        source: { type: 'string' },
        file_path: { type: 'string' },
        lines: { type: 'number' },
        size_bytes: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Template or source file not found' })
  async getContractSource(@Param('name') name: string) {
    const template = await this.contractTemplateService.getTemplateByName(name);
    const source = await this.contractTemplateService.getContractSource(template);
    
    return {
      name: template.name,
      rarity: template.rarity,
      source,
      file_path: template.file_path,
      lines: source.split('\n').length,
      size_bytes: Buffer.byteLength(source, 'utf8'),
    };
  }
}