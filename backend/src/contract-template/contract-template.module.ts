import { Module } from '@nestjs/common';
import { ContractTemplateController } from './contract-template.controller';
import { ContractTemplateService } from './contract-template.service';
import { RarityService } from './rarity.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [ContractTemplateController],
  providers: [ContractTemplateService, RarityService],
  exports: [ContractTemplateService, RarityService],
})
export class ContractTemplateModule {}