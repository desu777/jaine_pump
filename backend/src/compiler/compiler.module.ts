import { Module } from '@nestjs/common';
import { CompilerController } from './compiler.controller';
import { CompilerService } from './compiler.service';
import { SolidityCompilerService } from './solidity-compiler.service';
import { CompilationCacheService } from './compilation-cache.service';

@Module({
  controllers: [CompilerController],
  providers: [CompilerService, SolidityCompilerService, CompilationCacheService],
  exports: [CompilerService, SolidityCompilerService],
})
export class CompilerModule {}