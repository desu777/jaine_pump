import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '../config/config.service';
import { CompilerSettings, CompilationOutput } from './solidity-compiler.service';

export interface CacheEntry {
  id: string;
  template_id: number;
  source_hash: string;
  abi: string;
  bytecode: string;
  metadata: string;
  compiled_at: Date;
}

export interface CacheStats {
  total_cached: number;
  cache_hit_rate: number;
  last_cleanup: string;
  oldest_entry: string;
  newest_entry: string;
}

@Injectable()
export class CompilationCacheService {
  private readonly logger = new Logger(CompilationCacheService.name);
  private readonly CACHE_TTL_HOURS = 24; // 24 hours cache TTL
  private readonly MAX_CACHE_ENTRIES = 1000;
  
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Get cached compilation result
   */
  async getCached(sourceHash: string, templateId: number): Promise<CompilationOutput | null> {
    try {
      const cached = await this.prisma.compilationCache.findUnique({
        where: { source_hash: sourceHash },
      });

      if (!cached) {
        this.cacheMisses++;
        return null;
      }

      // Check if cache entry is still valid
      const expirationTime = new Date(cached.compiled_at.getTime() + this.CACHE_TTL_HOURS * 60 * 60 * 1000);
      
      if (new Date() > expirationTime) {
        // Cache expired, delete entry
        await this.prisma.compilationCache.delete({
          where: { id: cached.id },
        });
        
        this.cacheMisses++;
        return null;
      }

      this.cacheHits++;

      if (this.configService.app.testEnv) {
        this.logger.debug(`Cache hit for source hash: ${sourceHash}`);
      }

      return {
        abi: JSON.parse(cached.abi),
        bytecode: cached.bytecode,
        metadata: cached.metadata ? JSON.parse(cached.metadata) : {},
        sourceHash: cached.source_hash,
        compiledAt: cached.compiled_at,
      };

    } catch (error) {
      this.logger.error('Failed to retrieve from cache:', error);
      this.cacheMisses++;
      return null;
    }
  }

  /**
   * Store compilation result in cache
   */
  async setCached(
    sourceHash: string,
    templateId: number,
    compilationResult: CompilationOutput,
  ): Promise<void> {
    try {
      // Check cache size and cleanup if necessary
      await this.cleanupCacheIfNeeded();

      await this.prisma.compilationCache.create({
        data: {
          template_id: templateId,
          source_hash: sourceHash,
          abi: JSON.stringify(compilationResult.abi),
          bytecode: compilationResult.bytecode,
          metadata: JSON.stringify(compilationResult.metadata),
        },
      });

      if (this.configService.app.testEnv) {
        this.logger.debug(`Cached compilation result for hash: ${sourceHash}`);
      }

    } catch (error) {
      // Don't fail the compilation if caching fails
      this.logger.warn('Failed to cache compilation result:', error);
    }
  }

  /**
   * Check if compilation is cached
   */
  async isCached(sourceHash: string): Promise<boolean> {
    try {
      const cached = await this.prisma.compilationCache.findUnique({
        where: { source_hash: sourceHash },
        select: { compiled_at: true },
      });

      if (!cached) {
        return false;
      }

      // Check if still valid
      const expirationTime = new Date(cached.compiled_at.getTime() + this.CACHE_TTL_HOURS * 60 * 60 * 1000);
      return new Date() <= expirationTime;

    } catch (error) {
      this.logger.error('Failed to check cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const totalCached = await this.prisma.compilationCache.count();
      
      const hitRate = this.cacheHits + this.cacheMisses > 0 
        ? (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100 
        : 0;

      const [oldestEntry, newestEntry] = await Promise.all([
        this.prisma.compilationCache.findFirst({
          orderBy: { compiled_at: 'asc' },
          select: { compiled_at: true },
        }),
        this.prisma.compilationCache.findFirst({
          orderBy: { compiled_at: 'desc' },
          select: { compiled_at: true },
        }),
      ]);

      return {
        total_cached: totalCached,
        cache_hit_rate: Math.round(hitRate * 100) / 100,
        last_cleanup: new Date().toISOString(),
        oldest_entry: oldestEntry?.compiled_at.toISOString() || 'N/A',
        newest_entry: newestEntry?.compiled_at.toISOString() || 'N/A',
      };

    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return {
        total_cached: 0,
        cache_hit_rate: 0,
        last_cleanup: new Date().toISOString(),
        oldest_entry: 'N/A',
        newest_entry: 'N/A',
      };
    }
  }

  /**
   * Clear expired cache entries
   */
  async cleanupExpiredEntries(): Promise<number> {
    try {
      const expirationTime = new Date(Date.now() - this.CACHE_TTL_HOURS * 60 * 60 * 1000);
      
      const result = await this.prisma.compilationCache.deleteMany({
        where: {
          compiled_at: {
            lt: expirationTime,
          },
        },
      });

      if (result.count > 0 && this.configService.app.testEnv) {
        this.logger.debug(`Cleaned up ${result.count} expired cache entries`);
      }

      return result.count;

    } catch (error) {
      this.logger.error('Failed to cleanup expired cache entries:', error);
      return 0;
    }
  }

  /**
   * Clear all cache entries
   */
  async clearCache(): Promise<number> {
    try {
      const result = await this.prisma.compilationCache.deleteMany();
      
      // Reset hit/miss counters
      this.cacheHits = 0;
      this.cacheMisses = 0;

      this.logger.log(`Cleared ${result.count} cache entries`);
      return result.count;

    } catch (error) {
      this.logger.error('Failed to clear cache:', error);
      return 0;
    }
  }

  /**
   * Clean up cache if it exceeds maximum entries
   */
  private async cleanupCacheIfNeeded(): Promise<void> {
    try {
      const totalEntries = await this.prisma.compilationCache.count();
      
      if (totalEntries >= this.MAX_CACHE_ENTRIES) {
        // Delete oldest 20% of entries
        const entriesToDelete = Math.floor(this.MAX_CACHE_ENTRIES * 0.2);
        
        const oldestEntries = await this.prisma.compilationCache.findMany({
          orderBy: { compiled_at: 'asc' },
          take: entriesToDelete,
          select: { id: true },
        });

        if (oldestEntries.length > 0) {
          await this.prisma.compilationCache.deleteMany({
            where: {
              id: {
                in: oldestEntries.map(entry => entry.id),
              },
            },
          });

          if (this.configService.app.testEnv) {
            this.logger.debug(`Cleaned up ${oldestEntries.length} oldest cache entries`);
          }
        }
      }

    } catch (error) {
      this.logger.warn('Failed to cleanup cache:', error);
    }
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? (this.cacheHits / total) * 100 : 0;
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}