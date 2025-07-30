import { Module } from '@nestjs/common';
import { DeployController } from './deploy.controller';
import { DeployService } from './deploy.service';
import { UserModule } from '../user/user.module';
import { ContractTemplateModule } from '../contract-template/contract-template.module';

@Module({
  imports: [UserModule, ContractTemplateModule],
  controllers: [DeployController],
  providers: [DeployService],
  exports: [DeployService],
})
export class DeployModule {}