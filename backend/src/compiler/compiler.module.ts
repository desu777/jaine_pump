import { Module } from '@nestjs/common';
import { CompilerController } from './compiler.controller';
import { CompilerService } from './compiler.service';
import { SolidityCompilerService } from './solidity-compiler.service';
import { CompilationCacheService } from './compilation-cache.service';
import { ContractTemplateModule } from '../contract-template/contract-template.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule, ContractTemplateModule],
  controllers: [CompilerController],
  providers: [CompilerService, SolidityCompilerService, CompilationCacheService],
  exports: [CompilerService, SolidityCompilerService],
})
export class CompilerModule {}