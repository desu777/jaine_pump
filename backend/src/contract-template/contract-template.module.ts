import { Module } from '@nestjs/common';
import { ContractTemplateController } from './contract-template.controller';
import { ContractTemplateService } from './contract-template.service';
import { RarityService } from './rarity.service';

@Module({
  controllers: [ContractTemplateController],
  providers: [ContractTemplateService, RarityService],
  exports: [ContractTemplateService, RarityService],
})
export class ContractTemplateModule {}